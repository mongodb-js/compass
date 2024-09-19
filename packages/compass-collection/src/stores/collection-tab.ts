import type AppRegistry from 'hadron-app-registry';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer, {
  selectTab,
  collectionMetadataFetched,
} from '../modules/collection-tab';
import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';

export type CollectionTabOptions = {
  /**
   * Workspace Tab ID
   */
  tabId: string;
  /**
   * Collection namespace
   */
  namespace: string;
  /**
   * View namespace that can be passed when editing view pipeline in the source
   * collection
   */
  editViewName?: string;
};

export type CollectionTabServices = {
  dataService: DataService;
  collection: Collection;
  localAppRegistry: AppRegistry;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
};

export function activatePlugin(
  { namespace, editViewName, tabId }: CollectionTabOptions,
  services: CollectionTabServices,
  { on, cleanup }: ActivateHelpers
) {
  const {
    dataService,
    collection: collectionModel,
    localAppRegistry,
    workspaces,
  } = services;

  if (!collectionModel) {
    throw new Error(
      "Can't activate collection tab plugin without collection model"
    );
  }

  const store = createStore(
    reducer,
    {
      workspaceTabId: tabId,
      namespace,
      metadata: null,
      editViewName,
    },
    applyMiddleware(
      thunk.withExtraArgument({
        dataService,
        workspaces,
        localAppRegistry,
      })
    )
  );

  on(localAppRegistry, 'open-create-index-modal', () => {
    store.dispatch(selectTab('Indexes'));
  });

  on(localAppRegistry, 'open-create-search-index-modal', () => {
    store.dispatch(selectTab('Indexes'));
  });

  on(localAppRegistry, 'generate-aggregation-from-query', () => {
    store.dispatch(selectTab('Aggregations'));
  });

  void collectionModel.fetchMetadata({ dataService }).then((metadata) => {
    store.dispatch(collectionMetadataFetched(metadata));
  });

  return {
    store,
    deactivate: cleanup,
  };
}
