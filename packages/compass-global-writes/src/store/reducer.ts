import type { Action, Reducer } from 'redux';
import type { GlobalWritesThunkAction } from '.';

export function isAction<A extends Action>(
  action: Action,
  type: A['type']
): action is A {
  return action.type === type;
}

enum GlobalWritesActionTypes {
  SetIsManagedNamespace = 'global-writes/SetIsManagedNamespace',
}

type SetIsManagedNamespaceAction = {
  type: GlobalWritesActionTypes.SetIsManagedNamespace;
  isNamespaceManaged: boolean;
};

export enum ShardingStatuses {
  /**
   * Initial status, no information available yet.
   */
  NOT_READY = 'NOT_READY',

  /**
   * Namespace is not geo-sharded.
   */
  UNSHARDED = 'UNSHARDED',
}

export type RootState = {
  namespace: string;
  isNamespaceSharded: boolean;
  status: keyof typeof ShardingStatuses;
};

const initialState: RootState = {
  namespace: '',
  isNamespaceSharded: false,
  status: ShardingStatuses.NOT_READY,
};

const reducer: Reducer<RootState, Action> = (state = initialState, action) => {
  if (
    isAction<SetIsManagedNamespaceAction>(
      action,
      GlobalWritesActionTypes.SetIsManagedNamespace
    )
  ) {
    return {
      ...state,
      isNamespaceSharded: action.isNamespaceManaged,
      status: !action.isNamespaceManaged
        ? ShardingStatuses.UNSHARDED
        : state.status,
    };
  }
  return state;
};

export const fetchClusterShardingData =
  (): GlobalWritesThunkAction<Promise<void>, SetIsManagedNamespaceAction> =>
  async (
    dispatch,
    getState,
    { atlasGlobalWritesService, connectionInfoRef }
  ) => {
    if (!connectionInfoRef.current.atlasMetadata) {
      return;
    }

    const { namespace } = getState();
    const { clusterName, projectId } = connectionInfoRef.current.atlasMetadata;

    // Call the API to check if the namespace is managed. If the namespace is managed,
    // we would want to fetch more data that is needed to figure out the state and
    // accordingly show the UI to the user.
    const isNamespaceManaged =
      await atlasGlobalWritesService.isNamespaceManaged(namespace, {
        projectId,
        clusterName,
      });

    if (!isNamespaceManaged) {
      dispatch({
        type: GlobalWritesActionTypes.SetIsManagedNamespace,
        isNamespaceManaged: false,
      });
      return;
    }

    // Now fetch the sharding key and possible process error.
    return;
  };

export default reducer;
