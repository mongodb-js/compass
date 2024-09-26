import type { Action, Reducer } from 'redux';
import type { GlobalWritesThunkAction } from '.';
import { openToast } from '@mongodb-js/compass-components';
import type { ManagedNamespace } from '../services/atlas-global-writes-service';

export function isAction<A extends Action>(
  action: Action,
  type: A['type']
): action is A {
  return action.type === type;
}

export type CreateShardKeyData = Pick<
  ManagedNamespace,
  | 'customShardKey'
  | 'isCustomShardKeyHashed'
  | 'isShardKeyUnique'
  | 'numInitialChunks'
  | 'presplitHashedZones'
>;

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
  };
};

const initialState: RootState = {
  namespace: '',
  isNamespaceSharded: false,
  status: ShardingStatuses.NOT_READY,
  createShardkey: {
    isLoading: false,
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
    { atlasGlobalWritesService, connectionInfoRef, logger }
  ) => {
    if (!connectionInfoRef.current.atlasMetadata) {
      return;
    }

    const { namespace } = getState();
    const { clusterName, projectId } = connectionInfoRef.current.atlasMetadata;

    try {
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
          isNamespaceManaged,
        });
        return;
      }
      // TODO (COMPASS-8277): Now fetch the sharding key and possible process error.
    } catch (error) {
      logger.log.error(
        logger.mongoLogId(1_001_000_330),
        'AtlasFetchError',
        'Error fetching cluster sharding data',
        error as Error
      );
      openToast('global-writes-fetch-shard-info-error', {
        title: `Failed to fetch sharding information: ${
          (error as Error).message
        }`,
        dismissible: true,
        timeout: 5000,
        variant: 'important',
      });
    }
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
    { connectionInfoRef, atlasGlobalWritesService, logger }
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
      logger.log.error(
        logger.mongoLogId(1_001_000_331),
        'AtlasFetchError',
        'Error creating cluster shard key',
        {
          error: error as Error,
          data,
        }
      );
      openToast('global-writes-create-shard-key-error', {
        title: `Failed to create shard key: ${(error as Error).message}`,
        dismissible: true,
        timeout: 5000,
        variant: 'important',
      });
      dispatch({
        type: GlobalWritesActionTypes.ShardingInProgressErrored,
      });
    }
  };

export default reducer;
