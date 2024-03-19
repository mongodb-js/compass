import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import Databases from './components/databases';
import { activatePlugin as activateDatabasesTabPlugin } from './stores/databases-store';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';

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
