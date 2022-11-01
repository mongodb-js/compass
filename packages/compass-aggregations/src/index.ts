import type AppRegistry from 'hadron-app-registry';
import AggregationsPlugin from './plugin';
import configureStore from './stores';
import { Aggregations } from './components/aggregations';
import CreateViewPlugin from './components/create-view-plugin';
import DuplicateViewPlugin from './components/duplicate-view-plugin';
import configureCreateViewStore from './stores/create-view';
import duplicateViewStore from './stores/duplicate-view';
import StageEditor from './components/stage-editor';
import { PipelineStorage } from './utils/pipeline-storage';

/**
 * A sample role for the component.
 */
const ROLE = {
  name: 'Aggregations',
  component: AggregationsPlugin,
  order: 2,
  configureStore: configureStore,
  configureActions: () => {
    // noop
  },
  storeName: 'Aggregations.Store',
  actionName: 'Aggregations.Actions'
};

/**
 * Create view modal plugin.
 */
const CREATE_ROLE = {
  name: 'Create View',
  component: CreateViewPlugin,
  configureStore: configureCreateViewStore,
  storeName: 'Aggregations.CreateViewStore',
  configureActions: () => {
    // noop
  },
  actionName: 'Aggregations.Actions'
};

/**
 * Duplicate view role.
 */
const DUPLICATE_ROLE = {
  name: 'Duplicate View',
  component: DuplicateViewPlugin
};

/**
 * Activate all the components in the Aggregations package.

 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
const activate = (appRegistry: AppRegistry) => {
  appRegistry.registerRole('Collection.Tab', ROLE);
  appRegistry.registerRole('Collection.ScopedModal', CREATE_ROLE);
  appRegistry.registerRole('Global.Modal', DUPLICATE_ROLE);
  appRegistry.registerStore('Aggregations.DuplicateViewStore', duplicateViewStore);
};

/**
 * Deactivate all the components in the Aggregations package.

 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
const deactivate = (appRegistry: AppRegistry) => {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
  appRegistry.deregisterRole('Collection.ScopedModal', CREATE_ROLE);
  appRegistry.deregisterRole('Global.Modal', DUPLICATE_ROLE);
  appRegistry.deregisterStore('Aggregations.DuplicateViewStore');
};

export default AggregationsPlugin;
export {
  activate,
  deactivate,
  Aggregations,
  StageEditor,
  CreateViewPlugin,
  DuplicateViewPlugin,
  configureStore,
  configureCreateViewStore,
  PipelineStorage,
};
export { StoredPipeline } from './utils/pipeline-storage';
export { default as metadata } from '../package.json';
