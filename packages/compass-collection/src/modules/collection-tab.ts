import type { Reducer, AnyAction } from 'redux';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type Collection from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import toNs from 'mongodb-ns';
import React from 'react';

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

export type CollectionStateMetadata = CollectionMetadata & {
  serverVersion: string;
  isAtlas: boolean;
  isDataLake: boolean;
};

export type CollectionState = {
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
  metadata: CollectionStateMetadata;
  currentTab:
    | 'Documents'
    | 'Aggregations'
    | 'Schema'
    | 'Indexes'
    | 'Validation';
  initialQuery?: unknown;
  initialAggregation?: unknown;
  initialPipelineText?: string;
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

const initialMetadata: CollectionStateMetadata = {
  namespace: '',
  isReadonly: false,
  isTimeSeries: false,
  isClustered: false,
  isFLE: false,
  isSearchIndexesSupported: false,
  isAtlas: false,
  isDataLake: false,
  serverVersion: '0.0.0',
};

enum CollectionActions {
  CollectionStatsFetched = 'compass-collection/CollectionStatsFetched',
  CollectionMetadataFetched = 'compass-collection/CollectionMetadataFetched',
  ChangeTab = 'compass-collection/ChangeTab',
}

const reducer: Reducer<CollectionState> = (
  state = {
    stats: null,
    metadata: initialMetadata,
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
    const { metadata } = getState();
    const { database } = toNs(metadata.namespace);
    globalAppRegistry.emit('select-database', database);
  };
};

export const editView = (): CollectionThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    const { metadata } = getState();
    globalAppRegistry.emit('collection-tab-modify-view', {
      ns: metadata.namespace,
    });
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

export function createCollectionStoreMetadata(state: CollectionState) {
  return {
    ...state.metadata,
    query: state.initialQuery,
    aggregation: state.initialAggregation,
    pipelineText: state.initialPipelineText,
    editViewName: state.editViewName,
  };
}

export type CollectionTabPluginMetadata = ReturnType<
  typeof createCollectionStoreMetadata
>;

const setupRole = (
  roleName: string
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
        ...createCollectionStoreMetadata(getState()),
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

export const renderScopedModals = (): CollectionThunkAction<
  React.ReactElement[]
> => {
  return (dispatch) => {
    return dispatch(setupRole('Collection.ScopedModal')).map((role) => {
      return role.component;
    });
  };
};

export const renderTabs = (): CollectionThunkAction<
  { name: string; component: React.ReactElement }[]
> => {
  return (dispatch) => {
    // TODO(COMPASS-7020): we don't actually render query bar in the collection
    // tab, but compass-crud and compass-schema expect some additional roles and
    // stores to be already set up when they are rendered instead of handling
    // this on their own. We do this here and ignore the return value, this just
    // makes sure that other plugins can use query bar
    dispatch(setupRole('Query.QueryBar'));

    return dispatch(setupRole('Collection.Tab'));
  };
};

export default reducer;
