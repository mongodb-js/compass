// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec.
import 'mongodb-compass/src/app/styles/index.less';

import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import PluginManager from '@mongodb-js/hadron-plugin-manager';
import { AppContainer } from 'react-hot-loader';
import SecurityPlugin, { activate } from '../../src/index.js';
import Store from '../../src/stores';

import { corePlugin, extPlugin, errPlugin } from '../../test/renderer/fixtures';

const appRegistry = new AppRegistry();
const pluginManager = new PluginManager([], __dirname, []);

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;
global.hadronApp.pluginManager = pluginManager;

// Add some plugins manually to the plugin manager.
pluginManager.plugins = [ corePlugin, extPlugin, errPlugin ];

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    document.getElementById('root')
  );
};

// Activate our plugin with the Hadron App Registry
activate(appRegistry);
appRegistry.onActivated();

// Render our plugin
render(SecurityPlugin);

Store.show();

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
    render(SecurityPlugin);
  });
}
