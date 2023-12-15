import { registerHadronPlugin } from 'hadron-app-registry';
import { AggregationsPlugin } from './plugin';
import { activateAggregationsPlugin } from './stores/store';
import { Aggregations } from './components/aggregations';
import { activateCreateViewPlugin } from './stores/create-view';
import StageEditor from './components/stage-editor';
import CreateViewModal from './components/create-view-modal';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from 'mongodb-data-service/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type {
  OptionalDataServiceProps,
  RequiredDataServiceProps,
} from './modules/data-service';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

const activate = () => {
  // noop
};

const deactivate = () => {
  // noop
};

export const CompassAggregationsHadronPlugin = registerHadronPlugin(
  {
    name: 'CompassAggregations',
    component: AggregationsPlugin,
    activate: activateAggregationsPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<
      RequiredDataServiceProps,
      OptionalDataServiceProps
    >,
    workspaces: workspacesServiceLocator,
    instance: mongoDBInstanceLocator,
    preferences: preferencesLocator,
  }
);

export const CompassAggregationsPlugin = {
  name: 'Aggregations',
  component: CompassAggregationsHadronPlugin,
};

export const CreateViewPlugin = registerHadronPlugin(
  {
    name: 'CreateView',
    component: CreateViewModal,
    activate: activateCreateViewPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<'createView'>,
    logger: createLoggerAndTelemetryLocator('COMPASS-CREATE-VIEW-UI'),
    workspaces: workspacesServiceLocator,
  }
);

export default AggregationsPlugin;
export { activate, deactivate, Aggregations, StageEditor };
export { default as metadata } from '../package.json';
