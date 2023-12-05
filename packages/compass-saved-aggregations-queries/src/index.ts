import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from 'mongodb-data-service/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import type { DataService } from 'mongodb-data-service';
import { activatePlugin } from './stores';
import AggregationsQueriesList from './components/aggregations-queries-list';
import type {
  PipelineStorage,
  RecentQueryStorage,
} from '@mongodb-js/my-queries-storage';

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

const serviceLocators = {
  dataService: dataServiceLocator as DataServiceLocator<
    // Getting passed to the mongodb instance so hard to be more explicit
    // about used methods
    keyof DataService
  >,
  instance: mongoDBInstanceLocator,
  logger: createLoggerAndTelemetryLocator('COMPASS-MY-QUERIES-UI'),
};

export const MyQueriesPlugin = registerHadronPlugin<
  React.ComponentProps<typeof AggregationsQueriesList>,
  typeof serviceLocators & {
    queryStorage?: () => RecentQueryStorage;
    pipelineStorage?: () => PipelineStorage;
  }
>(
  {
    name: 'MyQueries',
    component: AggregationsQueriesList,
    activate: activatePlugin,
  },
  serviceLocators
);

export const WorkspaceTab = {
  name: 'My Queries' as const,
  component: MyQueriesPlugin,
};

export type MyQueriesWorkspace = {
  type: typeof WorkspaceTab['name'];
} & React.ComponentProps<typeof WorkspaceTab['component']>;

export default MyQueriesPlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
