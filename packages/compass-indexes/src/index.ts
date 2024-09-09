import {
  activatePlugin as activateDropIndexPlugin,
  DropIndexComponent,
} from './stores/drop-index';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  activateIndexesPlugin,
  type IndexesDataServiceProps,
} from './stores/store';
import Indexes from './components/indexes/indexes';
import {
  connectionInfoAccessLocator,
  dataServiceLocator,
  type DataServiceLocator,
} from '@mongodb-js/compass-connections/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';

export const CompassIndexesHadronPlugin = registerHadronPlugin(
  {
    name: 'CompassIndexes',
    component: Indexes as React.FunctionComponent,
    activate: activateIndexesPlugin,
  },
  {
    dataService:
      dataServiceLocator as DataServiceLocator<IndexesDataServiceProps>,
    connectionInfoAccess: connectionInfoAccessLocator,
    instance: mongoDBInstanceLocator,
    logger: createLoggerLocator('COMPASS-INDEXES-UI'),
    track: telemetryLocator,
  }
);

export const CompassIndexesPlugin = {
  name: 'Indexes' as const,
  component: CompassIndexesHadronPlugin,
};

export const DropIndexPlugin = registerHadronPlugin(
  {
    name: 'DropIndex',
    activate: activateDropIndexPlugin,
    component: DropIndexComponent,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<'dropIndex'>,
    logger: createLoggerLocator('COMPASS-INDEXES-UI'),
    track: telemetryLocator,
    connectionInfoAccess: connectionInfoAccessLocator,
  }
);
