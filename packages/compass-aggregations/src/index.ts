import { registerHadronPlugin } from 'hadron-app-registry';
import { AggregationsPlugin } from './plugin';
import { activateAggregationsPlugin } from './stores/store';
import { Aggregations } from './components/aggregations';
import { activateCreateViewPlugin } from './stores/create-view';
import StageEditor from './components/stage-editor';
import CreateViewModal from './components/create-view-modal';
import {
  connectionInfoAccessLocator,
  connectionScopedAppRegistryLocator,
  connectionsManagerLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
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
import { connectionRepositoryAccessLocator } from '@mongodb-js/compass-connections/provider';

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
    logger: createLoggerLocator('COMPASS-AGGREGATIONS-UI'),
    track: telemetryLocator,
    atlasAuthService: atlasAuthServiceLocator,
    atlasAiService: atlasAiServiceLocator,
    pipelineStorage: pipelineStorageLocator,
    connectionInfoAccess: connectionInfoAccessLocator,
    collection: collectionModelLocator,
    connectionScopedAppRegistry:
      connectionScopedAppRegistryLocator<'open-export'>,
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
    connectionRepository: connectionRepositoryAccessLocator,
    logger: createLoggerLocator('COMPASS-CREATE-VIEW-UI'),
    track: telemetryLocator,
    workspaces: workspacesServiceLocator,
  }
);

export default AggregationsPlugin;
export { Aggregations, StageEditor };
