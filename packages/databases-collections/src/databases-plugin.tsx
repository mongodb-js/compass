import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import Databases from './components/databases/databases';
import { activatePlugin as activateDatabasesTabPlugin } from './stores/databases-store';
import { registerHadronPlugin } from 'hadron-app-registry';

export const DatabasesPlugin = registerHadronPlugin(
  {
    name: 'Databases',
    component: Databases,
    activate: activateDatabasesTabPlugin,
  },
  { instance: mongoDBInstanceLocator }
);
