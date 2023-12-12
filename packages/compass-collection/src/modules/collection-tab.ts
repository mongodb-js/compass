import type { Reducer, AnyAction } from 'redux';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type Collection from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import toNs from 'mongodb-ns';
import React from 'react';
import type { CollectionTabOptions } from '../stores/collection-tab';

type CollectionThunkAction<
  ReturnType,
  Action extends AnyAction = AnyAction
> = ThunkAction<
  ReturnType,
  CollectionState,
  {
    globalAppRegistry: AppRegistry;
    localAppRegistry: AppRegistry;
    dataService: DataService;
  },
  Action
>;

export type CollectionState = {
  namespace: string;
  stats: Pick<
    Collection,
    | 'document_count'
    | 'index_count'
    | 'index_size'
    | 'status'
    | 'avg_document_size'
    | 'storage_size'
    | 'free_storage_size'
  > | null;
  metadata: CollectionMetadata | null;
  currentTab:
    | 'Documents'
    | 'Aggregations'
    | 'Schema'
    | 'Indexes'
    | 'Validation';
  editViewName?: string;
};

export function pickCollectionStats(
  collection: Collection
): CollectionState['stats'] {
  const {
    document_count,
    index_count,
    index_size,
    status,
    avg_document_size,
    storage_size,
    free_storage_size,
  } = collection.toJSON();
  return {
    document_count,
    index_count,
    index_size,
    status,
    avg_document_size,
    storage_size,
    free_storage_size,
  };
}

enum CollectionActions {
  CollectionStatsFetched = 'compass-collection/CollectionStatsFetched',
  CollectionMetadataFetched = 'compass-collection/CollectionMetadataFetched',
  ChangeTab = 'compass-collection/ChangeTab',
}

const reducer: Reducer<CollectionState> = (
  state = {
    namespace: '',
    stats: null,
    metadata: null,
    currentTab: 'Documents',
  },
  action
) => {
  if (action.type === CollectionActions.CollectionStatsFetched) {
    return {
      ...state,
      stats: pickCollectionStats(action.collection),
    };
  }
  if (action.type === CollectionActions.CollectionMetadataFetched) {
    return {
      ...state,
      metadata: action.metadata,
    };
  }
  if (action.type === CollectionActions.ChangeTab) {
    return {
      ...state,
      currentTab: action.tabName,
    };
  }
  return state;
};

export const collectionStatsFetched = (collection: Collection) => {
  return { type: CollectionActions.CollectionStatsFetched, collection };
};

export const collectionMetadataFetched = (metadata: CollectionMetadata) => {
  return { type: CollectionActions.CollectionMetadataFetched, metadata };
};

export const selectTab = (
  tabName: CollectionState['currentTab']
): CollectionThunkAction<void> => {
  return (dispatch, _getState, { localAppRegistry }) => {
    dispatch({ type: CollectionActions.ChangeTab, tabName });
    localAppRegistry.emit('subtab-changed', tabName);
  };
};
export const selectDatabase = (): CollectionThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    const { namespace } = getState();
    const { database } = toNs(namespace);
    globalAppRegistry.emit('select-database', database);
  };
};

export const editView = (): CollectionThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    const { namespace, metadata } = getState();
    if (metadata?.sourceName) {
      globalAppRegistry.emit('collection-tab-select-collection', {
        ns: metadata.sourceName,
        editViewName: namespace,
        pipeline: metadata?.sourcePipeline ?? null,
      });
    }
  };
};

export const returnToView = (): CollectionThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    const { editViewName } = getState();
    globalAppRegistry.emit('collection-tab-select-collection', {
      ns: editViewName,
    });
  };
};

export type CollectionTabPluginMetadata = CollectionMetadata & {
  query?: unknown;
  aggregation?: unknown;
  pipeline?: unknown[];
  pipelineText?: string;
  editViewName?: string;
};

const setupRole = (
  roleName: string,
  {
    namespace,
    initialAggregation,
    initialPipeline,
    initialPipelineText,
    initialQuery,
    editViewName,
  }: CollectionTabOptions
): CollectionThunkAction<{ name: string; component: React.ReactElement }[]> => {
  return (
    dispatch,
    getState,
    { localAppRegistry, globalAppRegistry, dataService }
  ) => {
    const roles = globalAppRegistry.getRole(roleName) ?? [];

    return roles.map((role) => {
      localAppRegistry.registerRole(roleName, role);

      const {
        name,
        component,
        storeName,
        configureStore,
        actionName,
        configureActions,
      } = role;

      const collectionStoreMetadata = {
        namespace,
        aggregation: initialAggregation,
        pipeline: initialPipeline,
        pipelineText: initialPipelineText,
        query: initialQuery,
        editViewName,
        ...getState().metadata,
        localAppRegistry,
        globalAppRegistry,
        dataProvider: {
          // Even though this is technically impossible, all scoped plugins
          // expect error key to be present
          error: null,
          dataProvider: dataService,
        },
      };

      let actions;
      if (actionName && configureActions) {
        actions =
          localAppRegistry.getAction(actionName) ??
          localAppRegistry
            .registerAction(actionName, configureActions())
            .getAction(actionName);
      }

      let store;
      if (storeName && configureStore) {
        store =
          localAppRegistry.getStore(storeName) ??
          localAppRegistry
            .registerStore(
              storeName,
              configureStore({ ...collectionStoreMetadata, actions })
            )
            .getStore(storeName);
      }

      return {
        name,
        component: React.createElement(component, {
          store,
          actions,
          key: name,
        }),
      };
    });
  };
};

export const renderScopedModals = (
  collectionOptions: CollectionTabOptions
): CollectionThunkAction<React.ReactElement[]> => {
  return (dispatch) => {
    return dispatch(setupRole('Collection.ScopedModal', collectionOptions)).map(
      (role) => {
        return role.component;
      }
    );
  };
};

export const renderTabs = (
  collectionOptions: CollectionTabOptions
): CollectionThunkAction<{ name: string; component: React.ReactElement }[]> => {
  return (dispatch) => {
    // TODO(COMPASS-7020): we don't actually render query bar in the collection
    // tab, but compass-crud and compass-schema expect some additional roles and
    // stores to be already set up when they are rendered instead of handling
    // this on their own. We do this here and ignore the return value, this just
    // makes sure that other plugins can use query bar
    return dispatch(setupRole('Query.QueryBar', collectionOptions));
  };
};

export default reducer;
