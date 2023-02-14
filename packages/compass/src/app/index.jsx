import ipc from 'hadron-ipc';
import * as remote from '@electron/remote';

import preferences from 'compass-preferences-model';

// Setup error reporting to main process before anything else.
window.addEventListener('error', (event) => {
  event.preventDefault();
  ipc.call(
    'compass:error:fatal',
    event.error
      ? { message: event.error.message, stack: event.error.stack }
      : { message: event.message, stack: '<no stack available>' }
  );
});

import './index.less';
import '../setup-hadron-distribution';
import 'source-code-pro/source-code-pro.css';

import * as marky from 'marky';
import EventEmitter from 'events';
marky.mark('Time to Connect rendered');
marky.mark('Time to user can Click Connect');

EventEmitter.defaultMaxListeners = 100;

document.addEventListener('dragover', (evt) => evt.preventDefault());
document.addEventListener('drop', (evt) => evt.preventDefault());

/**
 * Set hadron-app as a global so plugins can use it.
 */
import app from 'hadron-app';
global.hadronApp = app;

/**
 * The main entrypoint for the application!
 */
const APP_VERSION = remote.app.getVersion() || '';

import View from 'ampersand-view';
import async from 'async';
import * as webvitals from 'web-vitals';

import User from 'compass-user-model';

import './menu-renderer';
marky.mark('Migrations');
import migrateApp from './migrations';
marky.stop('Migrations');

import React from 'react';
import ReactDOM from 'react-dom';
import { Action } from '@mongodb-js/hadron-plugin-manager';

import { setupTheme } from './theme';

import { setupIntercom } from './intercom';

import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { log, mongoLogId, debug, track } =
  createLoggerAndTelemetry('COMPASS-APP');

/**
 * The top-level application singleton that brings everything together!
 */
const Application = View.extend({
  template: function () {
    return [
      '<div id="application">',
      '  <div data-hook="layout-container"></div>',
      '</div>',
    ].join('\n');
  },
  props: {
    version: {
      type: 'string',
      default: APP_VERSION,
    },
  },
  session: {
    /**
     *
     * The connection details for the MongoDB Instance we want to/are currently connected to.
     * @see mongodb-connection-model.js
     */
    connection: 'state',
    /**
     * Details of the MongoDB Instance we're currently connected to.
     */
    instance: 'state',
    /**
     * @see http://learn.humanjavascript.com/react-ampersand/creating-a-router-and-pages
     */
    router: 'object',
    /**
     * The previously shown app version.
     */
    previousVersion: {
      type: 'string',
      default: '0.0.0',
    },
  },
  children: {
    user: User,
  },
  initialize: function () {
    /**
     * @see NODE-4281
     * @todo: remove when NODE-4281 is merged.
     */
    Number.prototype.unref = () => {};

    function trackPerfEvent({ name, value }) {
      const fullName = {
        FCP: 'First Contentful Paint',
        LCP: 'Largest Contentful Paint',
        FID: 'First Input Delay',
        CLS: 'Cumulative Layout Shift',
      }[name];
      track(fullName, { value });
    }

    webvitals.getFCP(trackPerfEvent);
    webvitals.getLCP(trackPerfEvent);
    webvitals.getFID(trackPerfEvent);
    webvitals.getCLS(trackPerfEvent);
  },
  /**
   * Enable all debug output for the development mode.
   */
  preRender: function () {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('debug').enable('mon*,had*');
    }
  },
  /**
   * Pre-load into the require cache a bunch of expensive modules while the
   * user is choosing which connection, so when the user clicks on Connect,
   * Compass can connect to the MongoDB instance faster.
   */
  postRender: function () {
    marky.mark('Pre-loading additional modules required to connect');
    // Seems like this doesn't have as much of an effect as we'd hoped as
    // most of the expense has already occurred. You can see it take 1700ms
    // or so if you move this to the top of the file.
    require('local-links');
    require('mongodb-instance-model');
    marky.stop('Pre-loading additional modules required to connect');
  },
  /**
   * Called a soon as the DOM is ready so we can
   * start showing status indicators as
   * quickly as possible.
   */
  render: async function () {
    await preferences.refreshPreferences();
    const getAutoConnectInfo = await (
      await import('./auto-connect')
    ).loadAutoConnectInfo();
    log.info(
      mongoLogId(1_001_000_092),
      'Main Window',
      'Rendering app container',
      {
        autoConnectEnabled: !!getAutoConnectInfo,
      }
    );

    this.el = document.querySelector('#application');
    this.renderWithTemplate(this);

    const AutoUpdatesComponent =
      app.appRegistry.getRole('App.AutoUpdate')?.[0].component;

    if (AutoUpdatesComponent) {
      ReactDOM.render(
        <React.StrictMode>
          <AutoUpdatesComponent></AutoUpdatesComponent>
        </React.StrictMode>,
        this.queryByHook('auto-update')
      );
    }

    const HomeComponent = app.appRegistry.getComponent('Home.Home');

    if (HomeComponent) {
      ReactDOM.render(
        <React.StrictMode>
          <HomeComponent
            appRegistry={app.appRegistry}
            appName={remote.app.getName()}
            getAutoConnectInfo={getAutoConnectInfo}
          ></HomeComponent>
        </React.StrictMode>,
        this.queryByHook('layout-container')
      );
    }

    document.querySelector('#loading-placeholder')?.remove();
  },
  fetchUser: async function () {
    debug('getting user preferences');
    const { telemetryAnonymousId, lastKnownVersion } =
      preferences.getPreferences();

    // The main process ensured that `telemetryAnonymousId` contains the id of the User model.
    const user = await User.getOrCreate(telemetryAnonymousId);

    this.user.set(user.serialize());
    this.user.trigger('sync');
    debug('user fetch successful', user.serialize());

    this.previousVersion = lastKnownVersion || '0.0.0';
    await preferences.savePreferences({ lastKnownVersion: APP_VERSION });
    return user;
  },
});

const state = new Application();

app.extend({
  client: null,
  init: async function () {
    await preferences.refreshPreferences();

    async.series(
      [
        // Check if migrations are required.
        migrateApp.bind(state),
        // Get user.
        state.fetchUser.bind(state),
      ],
      function (err) {
        if (err) {
          throw err;
        }

        // Get theme from the preferences and set accordingly.
        setupTheme();

        Action.pluginActivationCompleted.listen(() => {
          state.preRender();
          global.hadronApp.appRegistry.onActivated();
          global.hadronApp.appRegistry.emit(
            'application-initialized',
            APP_VERSION,
            process.env.HADRON_PRODUCT_NAME
          );
          setupIntercom(state.user);
          // Catch a data refresh coming from window-manager.
          ipc.on('app:refresh-data', () =>
            global.hadronApp.appRegistry.emit('refresh-data')
          );
          // Catch a toggle sidebar coming from window-manager.
          ipc.on('app:toggle-sidebar', () =>
            global.hadronApp.appRegistry.emit('toggle-sidebar')
          );
          // As soon as dom is ready, render and set up the rest.
          state.render();
          marky.stop('Time to Connect rendered');
          state.postRender();
          marky.stop('Time to user can Click Connect');
          if (process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION) {
            queueMicrotask(() => {
              throw new Error('fake exception');
            });
          }
        });
        require('./setup-plugin-manager');
      }
    );
  },
});

Object.defineProperty(app, 'autoUpdate', {
  get: function () {
    return state.autoUpdate;
  },
});

Object.defineProperty(app, 'instance', {
  get: function () {
    return state.instance;
  },
  set: function (instance) {
    state.instance = instance;
  },
});

Object.defineProperty(app, 'connection', {
  get: function () {
    return state.connection;
  },
});

Object.defineProperty(app, 'router', {
  get: function () {
    return state.router;
  },
});

Object.defineProperty(app, 'user', {
  get: function () {
    return state.user;
  },
});

Object.defineProperty(app, 'state', {
  get: function () {
    return state;
  },
});

import './reflux-listen-to-external-store';
app.init();
