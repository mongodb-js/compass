import { registerHadronPlugin } from 'hadron-app-registry';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { activatePlugin } from './stores';
import AggregationsQueriesList from './components/aggregations-queries-list';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import {
  pipelineStorageLocator,
  favoriteQueryStorageAccessLocator,
} from '@mongodb-js/my-queries-storage/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';

const serviceLocators = {
  connections: connectionsLocator,
  instancesManager: mongoDBInstancesManagerLocator,
  preferencesAccess: preferencesLocator,
  logger: createLoggerLocator('COMPASS-MY-QUERIES-UI'),
  track: telemetryLocator,
  workspaces: workspacesServiceLocator,
  pipelineStorage: pipelineStorageLocator,
  favoriteQueryStorageAccess: favoriteQueryStorageAccessLocator,
};

export const MyQueriesPlugin = registerHadronPlugin(
  {
    name: 'MyQueries',
    component: AggregationsQueriesList,
    activate: activatePlugin,
  },
  serviceLocators
);

export const WorkspaceTab: WorkspaceComponent<'My Queries'> = {
  name: 'My Queries' as const,
  component: MyQueriesPlugin,
};

export default MyQueriesPlugin;
