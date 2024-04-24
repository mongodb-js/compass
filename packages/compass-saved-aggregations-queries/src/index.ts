import { registerHadronPlugin } from 'hadron-app-registry';
import {
  connectionInfoAccessLocator,
  dataServiceLocator,
  type DataService,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { activatePlugin } from './stores';
import AggregationsQueriesList from './components/aggregations-queries-list';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import {
  pipelineStorageLocator,
  favoriteQueryStorageAccessLocator,
} from '@mongodb-js/my-queries-storage/provider';

const serviceLocators = {
  dataService: dataServiceLocator as DataServiceLocator<
    // Getting passed to the mongodb instance so hard to be more explicit
    // about used methods
    keyof DataService
  >,
  instance: mongoDBInstanceLocator,
  logger: createLoggerAndTelemetryLocator('COMPASS-MY-QUERIES-UI'),
  workspaces: workspacesServiceLocator,
  pipelineStorage: pipelineStorageLocator,
  favoriteQueryStorageAccess: favoriteQueryStorageAccessLocator,
  connectionInfoAccess: connectionInfoAccessLocator,
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
