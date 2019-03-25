import AggregationsPlugin from './plugin';
import configureStore from 'stores';
import { Aggregations } from 'components/aggregations';

import CreateViewPlugin from 'components/create-view-plugin';
import CreateViewStore from 'stores/create-view';

import StageEditor from 'components/stage-editor';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Aggregations',
  component: AggregationsPlugin,
  order: 2,
  configureStore: configureStore,
  storeName: 'Aggregations.Store'
};

/**
 * Create view modal plugin.
 */
const CREATE_ROLE = {
  name: 'Create View',
  component: CreateViewPlugin
};

/**
 * Activate all the components in the Aggregations package.

 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
const activate = (appRegistry) => {
  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerRole('Global.Modal', CREATE_ROLE);
  appRegistry.registerStore('Aggregations.CreateViewStore', CreateViewStore);
};

/**
 * Deactivate all the components in the Aggregations package.

 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
const deactivate = (appRegistry) => {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterRole('Global.Modal', CREATE_ROLE);
  appRegistry.deregisterStore('Aggregations.CreateViewStore');
};

export default AggregationsPlugin;
export { activate, deactivate, Aggregations, StageEditor, CreateViewPlugin, configureStore };
