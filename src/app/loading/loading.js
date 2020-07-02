const AppRegistry = require('hadron-app-registry');
const ipc = require('hadron-ipc');
const React = require('react');
const ReactDOM = require('react-dom');

/**
 * The compass loading plugin is different from other plugins in that
 * it needs to get put directly into the loading screen before anything
 * else in the application happens.
 */
const LoadingPlugin = require('@mongodb-js/compass-loading');
const configureStore = LoadingPlugin.configureStore;
const CHANGE_STATUS = LoadingPlugin.CHANGE_STATUS;

/*
 * Global app registry for the loading window only.
 */
const globalAppRegistry = new AppRegistry();

/**
 * When we get a change status ipc event, emit it on the global
 * app registry.
 */
ipc.on(CHANGE_STATUS, (evt, meta) => {
  globalAppRegistry.emit(CHANGE_STATUS, meta);
});

ipc.on('compass:error:fatal', (evt, meta) => {
  // eslint-disable-next-line no-console
  console.error(meta.stack);
});

const loadingStore = configureStore({
  globalAppRegistry: globalAppRegistry
});

ReactDOM.render(
  React.createElement(LoadingPlugin.default, { store: loadingStore }),
  document.getElementById('root')
);
