import CollectionTab from './components/collection-tab';
import { activatePlugin as activateCollectionTabPlugin } from './stores/collection-tab';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataServiceLocator } from 'mongodb-data-service/provider';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import type { DataService } from 'mongodb-data-service';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';

export const CollectionTabPlugin = registerHadronPlugin(
  {
    name: 'CollectionTab',
    component: CollectionTab,
    activate: activateCollectionTabPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
    instance: mongoDBInstanceLocator,
  }
);

export const WorkspaceTab: WorkspaceComponent<'Collection'> = {
  name: 'Collection' as const,
  component: CollectionTabPlugin,
};

export default CollectionTabPlugin;
export type { CollectionTabPluginMetadata } from './modules/collection-tab';
export { CollectionTabsProvider } from './components/collection-tab-provider';
export { CollectionTabs, type CollectionTab } from './types';
