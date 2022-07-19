import type AppRegistry from 'hadron-app-registry';
import NLPQueryPlugin from './plugin';

const ROLE = {
  name: 'NLPQueryPlugin',
  component: NLPQueryPlugin,
  order: 1.5,
  configureStore: () => {
    /* noop */
  },
  configureActions: () => {
    /* noop */
  },
  storeName: 'Query.NLP.Store',
};

function activate(appRegistry: AppRegistry): void {
  // Register plugin stores, roles, and components.
  appRegistry.registerRole('Collection.Tab', ROLE);
}

function deactivate(appRegistry: AppRegistry): void {
  // Unregister plugin stores, roles, and components.
  appRegistry.deregisterRole('Collection.Tab', ROLE);
}

export { activate, deactivate, NLPQueryPlugin };
export { default as metadata } from '../package.json';
