import CollectionTab from './components/collection-tab';
import { activatePlugin as activateCollectionTabPlugin } from './stores/collection-tab';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import type { WorkspaceComponent } from '@mongodb-js/compass-workspaces';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';

export const CollectionTabPlugin = registerHadronPlugin(
  {
    name: 'CollectionTab',
    component: CollectionTab,
    activate: activateCollectionTabPlugin,
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
    instance: mongoDBInstanceLocator,
    workspaces: workspacesServiceLocator,
  }
);

export const WorkspaceTab: WorkspaceComponent<'Collection'> = {
  name: 'Collection' as const,
  component: CollectionTabPlugin,
};

export default CollectionTabPlugin;
export type { CollectionTabPluginMetadata } from './modules/collection-tab';
export { CollectionTabsProvider } from './components/collection-tab-provider';
