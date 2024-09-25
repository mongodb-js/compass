import type { Action, Reducer } from 'redux';
import type { GlobalWritesThunkAction } from '.';

export function isAction<A extends Action>(
  action: Action,
  type: A['type']
): action is A {
  return action.type === type;
}

export type CreateShardKeyData = {
  customShardKey: string;
  isShardKeyUnique: boolean;
  isCustomShardKeyHashed: boolean;
  presplitHashedZones: boolean;
  numInitialChunks: number | null;
};

enum GlobalWritesActionTypes {
  SetIsManagedNamespace = 'global-writes/SetIsManagedNamespace',
  ShardingInProgressStarted = 'global-writes/ShardingInProgressStarted',
  ShardingInProgressFinished = 'global-writes/ShardingInProgressFinished',
  ShardingInProgressErrored = 'global-writes/ShardingInProgressErrored',
}

type SetIsManagedNamespaceAction = {
  type: GlobalWritesActionTypes.SetIsManagedNamespace;
  isNamespaceManaged: boolean;
};

type ShardingInProgressStartedAction = {
  type: GlobalWritesActionTypes.ShardingInProgressStarted;
};

type ShardingInProgressFinishedAction = {
  type: GlobalWritesActionTypes.ShardingInProgressFinished;
};

type ShardingInProgressErroredAction = {
  type: GlobalWritesActionTypes.ShardingInProgressErrored;
  error: Error;
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

  /**
   * Namespace is being sharded.
   */
  SHARDING = 'SHARDING',
}

export type ShardingStatus = keyof typeof ShardingStatuses;

export type RootState = {
  namespace: string;
  isNamespaceSharded: boolean;
  status: ShardingStatus;
  createShardkey: {
    isLoading: boolean;
    error: Error | null;
  };
};

const initialState: RootState = {
  namespace: '',
  isNamespaceSharded: false,
  status: ShardingStatuses.NOT_READY,
  createShardkey: {
    isLoading: false,
    error: null,
  },
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

  if (
    isAction<ShardingInProgressStartedAction>(
      action,
      GlobalWritesActionTypes.ShardingInProgressStarted
    )
  ) {
    return {
      ...state,
      createShardkey: {
        isLoading: true,
        error: null,
      },
    };
  }

  if (
    isAction<ShardingInProgressFinishedAction>(
      action,
      GlobalWritesActionTypes.ShardingInProgressFinished
    )
  ) {
    return {
      ...state,
      isNamespaceSharded: true,
      status: ShardingStatuses.SHARDING,
      createShardkey: {
        isLoading: false,
        error: null,
      },
    };
  }

  if (
    isAction<ShardingInProgressErroredAction>(
      action,
      GlobalWritesActionTypes.ShardingInProgressErrored
    )
  ) {
    return {
      ...state,
      createShardkey: {
        isLoading: false,
        error: action.error,
      },
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

export const createShardKey =
  (
    data: CreateShardKeyData
  ): GlobalWritesThunkAction<
    Promise<void>,
    | ShardingInProgressStartedAction
    | ShardingInProgressFinishedAction
    | ShardingInProgressErroredAction
  > =>
  async (
    dispatch,
    getState,
    { connectionInfoRef, atlasGlobalWritesService }
  ) => {
    if (!connectionInfoRef.current.atlasMetadata) {
      return;
    }

    const { namespace } = getState();
    const { clusterName, projectId } = connectionInfoRef.current.atlasMetadata;

    dispatch({
      type: GlobalWritesActionTypes.ShardingInProgressStarted,
    });

    try {
      await atlasGlobalWritesService.createShardKey(namespace, data, {
        projectId,
        clusterName,
      });
      dispatch({
        type: GlobalWritesActionTypes.ShardingInProgressFinished,
      });
    } catch (error) {
      dispatch({
        type: GlobalWritesActionTypes.ShardingInProgressErrored,
        error: error as Error,
      });
    }
  };

export default reducer;
