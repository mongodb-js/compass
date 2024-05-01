import { registerHadronPlugin } from 'hadron-app-registry';
import { AggregationsPlugin } from './plugin';
import { activateAggregationsPlugin } from './stores/store';
import { Aggregations } from './components/aggregations';
import { activateCreateViewPlugin } from './stores/create-view';
import StageEditor from './components/stage-editor';
import CreateViewModal from './components/create-view-modal';
import {
  connectionInfoAccessLocator,
  connectionsManagerLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type {
  OptionalDataServiceProps,
  RequiredDataServiceProps,
} from './modules/data-service';
import {
  collectionModelLocator,
  mongoDBInstanceLocator,
} from '@mongodb-js/compass-app-stores/provider';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';
import { atlasAiServiceLocator } from '@mongodb-js/compass-generative-ai/provider';
import { pipelineStorageLocator } from '@mongodb-js/my-queries-storage/provider';

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
    logger: createLoggerAndTelemetryLocator('COMPASS-AGGREGATIONS-UI'),
    atlasAuthService: atlasAuthServiceLocator,
    atlasAiService: atlasAiServiceLocator,
    pipelineStorage: pipelineStorageLocator,
    connectionInfoAccess: connectionInfoAccessLocator,
    collection: collectionModelLocator,
  }
);

export const CompassAggregationsPlugin = {
  name: 'Aggregations' as const,
  component: CompassAggregationsHadronPlugin,
};

export const CreateViewPlugin = registerHadronPlugin(
  {
    name: 'CreateView',
    component: CreateViewModal,
    activate: activateCreateViewPlugin,
  },
  {
    connectionsManager: connectionsManagerLocator,
    logger: createLoggerAndTelemetryLocator('COMPASS-CREATE-VIEW-UI'),
    workspaces: workspacesServiceLocator,
  }
);

export default AggregationsPlugin;
export { Aggregations, StageEditor };
