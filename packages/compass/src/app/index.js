import ipc from 'hadron-ipc';

// Setup error reporting to main process before anything else.
window.addEventListener('error', (event) => {
  event.preventDefault();
  void ipc.ipcRenderer?.call(
    'compass:error:fatal',
    event.error
      ? { message: event.error.message, stack: event.error.stack }
      : { message: event.message, stack: '<no stack available>' }
  );
});

import { Action } from '@mongodb-js/hadron-plugin-manager';
import { render } from './application-view';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { setupIntercom } from './intercom';
import { setupTheme } from './theme';
import * as remote from '@electron/remote';
import * as webvitals from 'web-vitals';
import app from 'hadron-app';
import EventEmitter from 'events';
import migrateAppCb from './migrations';
import preferences from 'compass-preferences-model';
import User from 'compass-user-model';
import util from 'util';

const { log, mongoLogId, debug, track } =
  createLoggerAndTelemetry('COMPASS-APP');
const migrateApp = util.promisify(migrateAppCb);

// Set hadron-app as a global so plugins can use it.
global.hadronApp = app;

// Global side effects:
EventEmitter.defaultMaxListeners = 100;
document.addEventListener('dragover', (evt) => evt.preventDefault());
document.addEventListener('drop', (evt) => evt.preventDefault());

import { setupHadronDistribution } from '../setup-hadron-distribution';
import { deferRefluxStoreListener } from './reflux-listen-to-external-store';
import { attachZoomHandlers } from './zoom-handlers';

const APP_VERSION = remote.app.getVersion() || '';

async function initialize() {
  // Enable all debug output for the development mode.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('debug').enable('mon*,had*');
  }

  // setup process.env variables for from webpack
  setupHadronDistribution();

  // defers attaching a store listener to a store until all packages have
  // been activated in the app registry.
  deferRefluxStoreListener();

  // Attach Zoom handlers to the menu
  attachZoomHandlers();

  // Initialize web vitals:
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

  // Fetch preferences and user from disk:
  await preferences.refreshPreferences();

  const { telemetryAnonymousId } = preferences.getPreferences();
  const user = await User.getOrCreate(telemetryAnonymousId);
  debug('user fetch successful', user.serialize());

  // Run migrations as needed:
  await migrateApp();

  // Update the the last known version after migrations:
  await preferences.savePreferences({ lastKnownVersion: APP_VERSION });

  try {
    // Get theme from the preferences and set accordingly.
    setupTheme();
  } catch (e) {
    // Note: this should not happen, but we can avoid crashing the app
    log.error(
      mongoLogId(1_001_000_164),
      'Main Window',
      'Error setting up the theme',
      {
        error: e.message,
      }
    );
  }

  // Get auto-connection info
  const getAutoConnectInfo = await (
    await import('./auto-connect')
  ).loadAutoConnectInfo();

  Action.pluginActivationCompleted.listen(() => {
    global.hadronApp.appRegistry.onActivated();
    setupIntercom(user);
    // Catch a data refresh coming from window-manager.
    ipc.on('app:refresh-data', () =>
      global.hadronApp.appRegistry.emit('refresh-data')
    );
    // Catch a toggle sidebar coming from window-manager.
    ipc.on('app:toggle-sidebar', () =>
      global.hadronApp.appRegistry.emit('toggle-sidebar')
    );

    // As soon as dom is ready, render and set up the rest.
    log.info(
      mongoLogId(1_001_000_163),
      'Main Window',
      'Rendering app container',
      {
        autoConnectEnabled: !!getAutoConnectInfo,
      }
    );

    render({ app, getAutoConnectInfo, remote });

    if (process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION) {
      queueMicrotask(() => {
        throw new Error('fake exception');
      });
    }
  });

  require('./setup-plugin-manager');
}

void initialize();
