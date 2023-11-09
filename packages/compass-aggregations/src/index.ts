import type AppRegistry from 'hadron-app-registry';
import { registerHadronPlugin } from 'hadron-app-registry';
import AggregationsPlugin from './plugin';
import configureStore from './stores/store';
import { Aggregations } from './components/aggregations';
import { activateCreateViewPlugin } from './stores/create-view';
import StageEditor from './components/stage-editor';
import CreateViewModal from './components/create-view-modal';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';

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
  actionName: 'Aggregations.Actions',
};

/**
 * Activate all the components in the Aggregations package.

 * @param {Object} appRegistry - The Hadron appRegisrty to activate this plugin with.
 **/
const activate = (appRegistry: AppRegistry) => {
  appRegistry.registerRole('Collection.Tab', ROLE);
};

/**
 * Deactivate all the components in the Aggregations package.

 * @param {Object} appRegistry - The Hadron appRegisrty to deactivate this plugin with.
 **/
const deactivate = (appRegistry: AppRegistry) => {
  appRegistry.deregisterRole('Collection.Tab', ROLE);
};

export const CreateViewPlugin = registerHadronPlugin(
  {
    name: 'CreateView',
    component: CreateViewModal,
    activate: activateCreateViewPlugin,
  },
  {
    dataService: dataServiceLocator as typeof dataServiceLocator<'createView'>,
    logger: createLoggerAndTelemetryLocator('COMPASS-CREATE-VIEW-UI'),
  }
);

export default AggregationsPlugin;
export { activate, deactivate, Aggregations, StageEditor, configureStore };
export { default as metadata } from '../package.json';
