import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import Databases from './components/databases';
import { activatePlugin as activateDatabasesTabPlugin } from './stores/databases-store';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataServiceLocator } from '@mongodb-js/compass-connections/provider';
import { dataServiceLocator } from '@mongodb-js/compass-connections/provider';
import type { DataService } from 'mongodb-data-service';

export const DatabasesPlugin = registerHadronPlugin(
  {
    name: 'Databases',
    component: Databases,
    activate: activateDatabasesTabPlugin,
  },
  {
    instance: mongoDBInstanceLocator,
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
  }
);
