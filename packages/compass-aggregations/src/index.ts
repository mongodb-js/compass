import { registerHadronPlugin } from 'hadron-app-registry';
import { AggregationsPlugin } from './plugin';
import { activateAggregationsPlugin } from './stores/store';
import { Aggregations } from './components/aggregations';
import { activateCreateViewPlugin } from './stores/create-view';
import StageEditor from './components/stage-editor';
import CreateViewModal from './components/create-view-modal';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type {
  DataService,
  OptionalDataServiceProps,
  RequiredDataServiceProps,
} from './modules/data-service';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

const activate = () => {
  // noop
};

const deactivate = () => {
  // noop
};

export const CompassAggregationsHadronPlugin = registerHadronPlugin<
  CollectionTabPluginMetadata,
  { dataService: () => DataService }
>(
  {
    name: 'CompassAggregations',
    component: AggregationsPlugin,
    activate: activateAggregationsPlugin,
  },
  {
    dataService: dataServiceLocator as typeof dataServiceLocator<
      RequiredDataServiceProps,
      OptionalDataServiceProps
    >,
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
    dataService: dataServiceLocator as typeof dataServiceLocator<'createView'>,
    logger: createLoggerAndTelemetryLocator('COMPASS-CREATE-VIEW-UI'),
  }
);

export default AggregationsPlugin;
export { activate, deactivate, Aggregations, StageEditor };
export { default as metadata } from '../package.json';
