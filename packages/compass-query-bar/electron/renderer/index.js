import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import QueryBarPlugin, { activate } from '../../src/index.js';
import configureStore from '../../src/stores';
import configureActions from '../../src/actions';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
appRegistry.onActivated();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild( root );

const actions = configureActions();
const localAppRegistry = new AppRegistry();
const store = configureStore({
  globalAppRegistry: appRegistry,
  localAppRegistry: localAppRegistry,
  serverVersion: '4.2.0',
  namespace: 'echo.artists',
  actions: actions,
  fields: [
    { name: 'harry',
      value: 'harry',
      score: 1,
      meta: 'field',
      version: '0.0.0' },
    { name: 'potter',
      value: 'potter',
      score: 1,
      meta: 'field',
      version: '0.0.0' }
  ]
});

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} actions={actions} />
    </AppContainer>,
    document.getElementById('root')
  );
};

localAppRegistry.emit('fields-changed', { aceFields: [
  { name: 'harry',
    value: 'harry',
    score: 1,
    meta: 'field',
    version: '0.0.0' },
  { name: 'potter',
    value: 'potter',
    score: 1,
    meta: 'field',
    version: '0.0.0' }
]});

// Render our plugin
render(QueryBarPlugin);

if (module.hot) {
  /**
   * Warning from React Router, caused by react-hot-loader.
   * The warning can be safely ignored, so filter it from the console.
   * Otherwise you'll see it every time something changes.
   * See https://github.com/gaearon/react-hot-loader/issues/298
   */
  const orgError = console.error; // eslint-disable-line no-console
  console.error = (message) => { // eslint-disable-line no-console
    if (message && message.indexOf('You cannot change <Router routes>;') === -1) {
      // Log the error as normally
      orgError.apply(console, [message]);
    }
  };

  module.hot.accept('plugin', () => {
    // Because Webpack 2 has built-in support for ES2015 modules,
    // you won't need to re-require your app root in module.hot.accept
    render(QueryBarPlugin);
  });
}
