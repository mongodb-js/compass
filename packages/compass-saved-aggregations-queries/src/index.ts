import { registerHadronPlugin } from 'hadron-app-registry';
import { connectionsManagerLocator } from '@mongodb-js/compass-connections/provider';
import { mongoDBInstancesManagerLocator } from '@mongodb-js/compass-app-stores/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { activatePlugin } from './stores';
import AggregationsQueriesList from './components/aggregations-queries-list';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import {
  pipelineStorageLocator,
  favoriteQueryStorageAccessLocator,
} from '@mongodb-js/my-queries-storage/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

const serviceLocators = {
  connectionsManager: connectionsManagerLocator,
  instancesManager: mongoDBInstancesManagerLocator,
  preferencesAccess: preferencesLocator,
  logger: createLoggerAndTelemetryLocator('COMPASS-MY-QUERIES-UI'),
  workspaces: workspacesServiceLocator,
  pipelineStorage: pipelineStorageLocator,
  favoriteQueryStorageAccess: favoriteQueryStorageAccessLocator,
};

export const MyQueriesPlugin = registerHadronPlugin<
  React.ComponentProps<typeof AggregationsQueriesList>,
  typeof serviceLocators
>(
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
