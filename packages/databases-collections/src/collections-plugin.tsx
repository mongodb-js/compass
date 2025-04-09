import {
  databaseModelLocator,
  mongoDBInstanceLocator,
} from '@mongodb-js/compass-app-stores/provider';
import CollectionsList from './components/collections';
import { activatePlugin as activateCollectionsTabPlugin } from './stores/collections-store';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';

export const CollectionsPlugin = registerHadronPlugin(
  {
    name: 'Collections',
    component: CollectionsList,
    activate: activateCollectionsTabPlugin,
  },
  {
    instance: mongoDBInstanceLocator,
    database: databaseModelLocator,
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
    preferences: preferencesLocator,
  }
);
