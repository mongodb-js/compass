import type { Reducer, AnyAction } from 'redux';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type Collection from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import { CollectionSubtabs, type CollectionSubtab } from '../types';

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
  currentTab: CollectionSubtab;
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
    currentTab: CollectionSubtabs.Documents,
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

export type CollectionTabPluginMetadata = CollectionMetadata & {
  /**
   * Initial query for the query bar
   */
  query?: unknown;
  /**
   * Stored pipeline metadata. Can be provided to preload stored pipeline
   * right when the plugin is initialized
   */
  aggregation?: unknown;
  /**
   * Initial pipeline that will be converted to a string to be used by the
   * aggregation builder. Takes precedence over `pipelineText` option
   */
  pipeline?: unknown[];
  /**
   * Initial pipeline text to be used by the aggregation builder
   */
  pipelineText?: string;
  /**
   * Namespace for the view that is being edited. Needs to be provided with the
   * `pipeline` options
   */
  editViewName?: string;
};

export default reducer;
