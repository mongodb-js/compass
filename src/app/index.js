/* eslint no-console:0 */
const marky = require('marky');
marky.mark('Time to Connect rendered');
marky.mark('Time to user can Click Connect');

require('../setup-hadron-distribution');

window.jQuery = require('jquery');
require('bootstrap/js/modal');
require('bootstrap/js/transition');

const debug = require('debug')('mongodb-compass:app');

/**
 * Set hadron-app as a global so plugins can use it.
 */
const app = require('hadron-app');
global.hadronApp = app;

require('./setup-hadron-caches');

/**
 * The main entrypoint for the application!
 */
const electron = require('electron');
const APP_VERSION = electron.remote.app.getVersion();

const ipc = require('hadron-ipc');

require('./menu-renderer');

const React = require('react');
const ReactDOM = require('react-dom');
// const AutoUpdate = require('../auto-update');
const { Action } = require('hadron-plugin-manager');

ipc.once('app:launched', function() {
  if (process.env.NODE_ENV !== 'production') {
    require('debug').enable('mon*,had*');
    require('debug/browser');
  }
});

marky.mark('Loading styles');
const setupStyleManager = require('./setup-style-manager');
setupStyleManager('index.less', () => {
  window.app = app;
  marky.stop('Loading styles');
  require('./setup-plugin-manager');
});

// @todo: Move out to plugin.
const User = require('./models/user');
function fetchUser(done) {
  debug('preferences fetched, now getting user');
  User.getOrCreate(app.preferences.currentUserId, (err, user) => {
    if (err) {
      return done(err);
    }
    app.user = user;
    app.user.set(user.serialize());
    app.user.trigger('sync');
    app.preferences.save({ currentUserId: user.id });
    debug('user fetch successful', user.serialize());
    done(null, user);
  });
}

Action.pluginActivationCompleted.listen(() => {
  // @todo: Remove preferences code/init when all plugins conform to the API.
  app.appRegistry.callOnStores((store) => {
    if (store.onInitialized) {
      store.onInitialized(APP_VERSION);
    }
  });
  app.preferences = app.appRegistry.getStore('Preferences.Store').state.preferences;

  fetchUser((err) => {
    if (err) return;
    app.appRegistry.onActivated();

    /**
     * When all the plugins are converted to the new templates and Compass
     * itself is using Webpack, we can remove the compile cache and the
     * style manager and move plugin setup to hadron-app itself.
     */
    const WORKSPACE = 'Application.Workspace';
    const workspaceRole = app.appRegistry.getRole(WORKSPACE)[0].component;

    ipc.call('window:renderer-ready');

    ReactDOM.render(
      React.createElement(workspaceRole),
      document.getElementById('application')
    );

    marky.stop('Time to Connect rendered');
    marky.stop('Time to user can Click Connect');
  });
});
