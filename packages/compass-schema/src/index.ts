import type AppRegistry from 'hadron-app-registry';

import CompassSchemaPlugin from './plugin';
import configureStore from './stores';
import configureActions from './actions';
import { TAB_NAME } from './constants/plugin';

// Compass plugin role definition.
const ROLE = {
  component: CompassSchemaPlugin,
  name: TAB_NAME,
  hasQueryHistory: true,
  order: 3,
  configureStore: configureStore,
  configureActions: configureActions,
  storeName: 'Schema.Store',
  actionName: 'Schema.Actions',
};

/**
 * Activate all the components in the Compass Schema package.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Collection.Tab', ROLE);
}

/**
 * Deactivate all the components in the Compass Schema package.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
}

export default CompassSchemaPlugin;
export { activate, deactivate, configureStore };
export { default as metadata } from '../package.json';
