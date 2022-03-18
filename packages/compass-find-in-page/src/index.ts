import type AppRegistry from 'hadron-app-registry';

import CompassFindInPagePlugin from './plugin';
import CompassFindInPageStore from './stores';

const ROLE = {
  name: 'FindInPage',
  component: CompassFindInPagePlugin,
};

/**
 * Activate all the components in the Compass Find In Page package.
 * @param {Object} appRegistry - The Hadron appRegistry to activate this plugin with.
 **/
function activate(appRegistry: AppRegistry): void {
  // Register the CompassFindInPagePlugin as a role in Compass
  appRegistry.registerRole('Find', ROLE);
  appRegistry.registerStore('FindInPage.Store', CompassFindInPageStore);
}

/**
 * Deactivate all the components in the Compass Find In Page package.
 * @param {Object} appRegistry - The Hadron appRegistry to deactivate this plugin with.
 **/
function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Find', ROLE);
  appRegistry.deregisterStore('FindInPage.Store');
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
