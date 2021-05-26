import React from 'react';
import ReactDOM from 'react-dom';
import app from 'hadron-app';
import AppRegistry from 'hadron-app-registry';
import { AppContainer } from 'react-hot-loader';
import IndexesPlugin, { activate } from '../../src/index.js';
import DeploymentStateStore from './stores/deployment-state-store';
import TextWriteButton from './components/text-write-button';
import { activate as fieldStoreActivate } from '@mongodb-js/compass-field-store';
import Collation from './components/collation';
import configureStore, { setDataProvider } from '../../src/stores';

// Import global less file. Note: these styles WILL NOT be used in compass, as compass provides its own set
// of global styles. If you are wishing to style a given component, you should be writing a less file per
// component as per the CSS Modules ICSS spec. @see src/components/toggle-button for an example.
import 'bootstrap/less/bootstrap.less';
import 'less/index.less';

const appRegistry = new AppRegistry();

const NS = 'test.shipwrecks';

global.hadronApp = app;
global.hadronApp.appRegistry = appRegistry;

// Activate our plugin with the Hadron App Registry
activate(appRegistry);

const localAppRegistry = new AppRegistry();
const store = configureStore({
  namespace: NS,
  isReadonly: false,
  localAppRegistry: localAppRegistry,
  globalAppRegistry: appRegistry
});
fieldStoreActivate(localAppRegistry);

appRegistry.registerStore('DeploymentAwareness.WriteStateStore', DeploymentStateStore);
appRegistry.registerComponent('DeploymentAwareness.TextWriteButton', TextWriteButton);
appRegistry.registerComponent('Collation.Select', Collation);

appRegistry.onActivated();

DeploymentStateStore.setToInitial();

// Since we are using HtmlWebpackPlugin WITHOUT a template,
// we should create our own root node in the body element before rendering into it.
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

const scopedModalRoles = appRegistry.getRole('Collection.ScopedModal');
const scopedModals = scopedModalRoles.map((role, i) => {
  const scopedStore = role.configureStore({
    localAppRegistry: localAppRegistry,
    globalAppRegistry: appRegistry,
    namespace: NS,
    isReadonly: false
  });
  return (<role.component store={scopedStore} key={i} />);
});

const fieldStore = localAppRegistry.getStore('Field.Store');
const confFieldStore = fieldStore({
  localAppRegistry: localAppRegistry,
  namespace: NS
});
localAppRegistry.registerStore('Field.Store', confFieldStore);


// Create a HMR enabled render function
const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <div>
        <Component store={store} />
        {scopedModals}
      </div>
    </AppContainer>,
    document.getElementById('root')
  );
};

// For initialization events to happen in isolation, uncomment the
// following lines as needed in the same places they are commented out.
//
// // Application was initialized.
// appRegistry.emit('application-initialized', '1.11.0-dev');

// Render our plugin - don't remove the following line.
render(IndexesPlugin);

// Data service initialization and connection.
import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';

const connection = new Connection({
  hostname: '127.0.0.1',
  port: 27017
});
const dataService = new DataService(connection);

dataService.connect((error, ds) => {
  setDataProvider(store, error, ds);
  localAppRegistry.emit('data-service-connected', error, ds);
  ds.find(NS, {}, {limit: 1}, (err, s) => {
    if (err) console.log(`ERROR: ${err.message}`);
    localAppRegistry.emit('documents-refreshed', null, s);
  });
});

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
    render(IndexesPlugin);
  });
}
