import type AppRegistry from 'hadron-app-registry';
import QueryBarPlugin from './plugin';
import configureStore from './stores';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Query Bar',
  component: QueryBarPlugin,
  configureStore: configureStore,
  storeName: 'Query.Store',
};

/**
 * Activate all the components in the Query Bar package.
 * @param {Object} appRegistry - The global appRegisrty to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Query.QueryBar', ROLE);
}

/**
 * Deactivate all the components in the Query Bar package.
 * @param {Object} appRegistry - The global appRegisrty to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Query.QueryBar', ROLE);
}

export default QueryBarPlugin;
export { activate, deactivate, configureStore };
export { default as metadata } from '../package.json';
