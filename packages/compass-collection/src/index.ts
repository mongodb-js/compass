import React from 'react';
import CollectionTab from './components/collection-tab';
import { activatePlugin as activateCollectionTabPlugin } from './stores/collection-tab';
import { registerCompassPlugin } from 'compass-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';
import { collectionModelLocator } from '@mongodb-js/compass-app-stores/provider';
import type { WorkspacePlugin } from '@mongodb-js/compass-workspaces';
import { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import {
  CollectionWorkspaceTitle,
  CollectionPluginTitleComponent,
} from './plugin-tab-title';

export const WorkspaceTab: WorkspacePlugin<typeof CollectionWorkspaceTitle> = {
  name: CollectionWorkspaceTitle,
  provider: registerCompassPlugin(
    {
      name: CollectionWorkspaceTitle,
      component: function CollectionProvider({ children }) {
        return React.createElement(React.Fragment, null, children);
      },
      activate: activateCollectionTabPlugin,
    },
    {
      dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
      collection: collectionModelLocator,
      workspaces: workspacesServiceLocator,
    }
  ),
  content: CollectionTab,
  header: CollectionPluginTitleComponent,
};

export type { CollectionTabPluginMetadata } from './modules/collection-tab';
export { CollectionTabsProvider } from './components/collection-tab-provider';
