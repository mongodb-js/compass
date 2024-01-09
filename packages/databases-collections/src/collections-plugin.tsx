import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import CollectionsList from './components/collections';
import { activatePlugin as activateCollectionsTabPlugin } from './stores/collections-store';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import type { DataService } from 'mongodb-data-service';

export const CollectionsPlugin = registerHadronPlugin(
  {
    name: 'Collections',
    component: CollectionsList,
    activate: activateCollectionsTabPlugin,
  },
  {
    instance: mongoDBInstanceLocator,
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
  }
);
