import type { Reducer, AnyAction } from 'redux';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type Collection from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';

type CollectionThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  CollectionState,
  {
    localAppRegistry: AppRegistry;
    dataService: DataService;
    workspaces: ReturnType<typeof workspacesServiceLocator>;
  },
  A
>;

export type CollectionState = {
  workspaceTabId: string;
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
}

const reducer: Reducer<CollectionState> = (
  state = {
    // TODO: COMPASS-7782 use hook to get the workspace tab id instead
    workspaceTabId: '',
    namespace: '',
    stats: null,
    metadata: null,
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
  return state;
};

export const collectionStatsFetched = (collection: Collection) => {
  return { type: CollectionActions.CollectionStatsFetched, collection };
};

export const collectionMetadataFetched = (metadata: CollectionMetadata) => {
  return { type: CollectionActions.CollectionMetadataFetched, metadata };
};

export const selectTab = (
  tabName: CollectionSubtab
): CollectionThunkAction<void> => {
  return (_dispatch, getState, { localAppRegistry, workspaces }) => {
    localAppRegistry.emit('subtab-changed', tabName);
    workspaces.openCollectionWorkspaceSubtab(
      getState().workspaceTabId,
      tabName
    );
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
