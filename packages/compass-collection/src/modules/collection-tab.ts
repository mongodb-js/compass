import type { Reducer, AnyAction, Action } from 'redux';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type { ThunkAction } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { CollectionSubtab } from '@mongodb-js/compass-workspaces';
import type { DataService } from '@mongodb-js/compass-connections/provider';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

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
  metadata: CollectionMetadata | null;
  editViewName?: string;
  collections: Array<string>;
};

enum CollectionActions {
  CollectionMetadataFetched = 'compass-collection/CollectionMetadataFetched',
  CollectionsFetched = 'compass-collection/CollectionsFetched',
}

interface CollectionMetadataFetchedAction {
  type: CollectionActions.CollectionMetadataFetched;
  metadata: CollectionMetadata;
}
interface CollectionsFetchedAction {
  type: CollectionActions.CollectionsFetched;
  collections: Array<string>;
}

const reducer: Reducer<CollectionState, Action> = (
  state = {
    // TODO(COMPASS-7782): use hook to get the workspace tab id instead
    workspaceTabId: '',
    namespace: '',
    metadata: null,
    collections: [],
  },
  action
) => {
  if (
    isAction<CollectionMetadataFetchedAction>(
      action,
      CollectionActions.CollectionMetadataFetched
    )
  ) {
    return {
      ...state,
      metadata: action.metadata,
    };
  }

  if (
    isAction<CollectionsFetchedAction>(
      action,
      CollectionActions.CollectionsFetched
    )
  ) {
    return {
      ...state,
      collections: action.collections,
    };
  }
  return state;
};

export const collectionMetadataFetched = (
  metadata: CollectionMetadata
): CollectionMetadataFetchedAction => {
  return { type: CollectionActions.CollectionMetadataFetched, metadata };
};

export const collectionsFetched = (
  collections: Array<string>
): CollectionsFetchedAction => {
  return { type: CollectionActions.CollectionsFetched, collections };
};

export const selectTab = (
  tabName: CollectionSubtab
): CollectionThunkAction<void> => {
  return (_dispatch, getState, { workspaces }) => {
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
