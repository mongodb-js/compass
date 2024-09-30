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
  IsManagedNamespaceFetched = 'global-writes/IsManagedNamespaceFetched',
  SubmittingForShardingStarted = 'global-writes/SubmittingForShardingStarted',
  SubmittingForShardingFinished = 'global-writes/SubmittingForShardingFinished',
  SubmittingForShardingErrored = 'global-writes/SubmittingForShardingErrored',
}

type IsManagedNamespaceFetchedAction = {
  type: GlobalWritesActionTypes.IsManagedNamespaceFetched;
  isNamespaceManaged: boolean;
};

type SubmittingForShardingStartedAction = {
  type: GlobalWritesActionTypes.SubmittingForShardingStarted;
};

type SubmittingForShardingFinishedAction = {
  type: GlobalWritesActionTypes.SubmittingForShardingFinished;
};

type SubmittingForShardingErroredAction = {
  type: GlobalWritesActionTypes.SubmittingForShardingErrored;
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
   * State when user submits namespace to be sharded and
   * we are waiting for server to accept the request.
   */
  SUBMITTING_FOR_SHARDING = 'SUBMITTING_FOR_SHARDING',

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
};

const initialState: RootState = {
  namespace: '',
  isNamespaceSharded: false,
  status: ShardingStatuses.NOT_READY,
};

const reducer: Reducer<RootState, Action> = (state = initialState, action) => {
  if (
    isAction<IsManagedNamespaceFetchedAction>(
      action,
      GlobalWritesActionTypes.IsManagedNamespaceFetched
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
    isAction<SubmittingForShardingStartedAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingStarted
    )
  ) {
    return {
      ...state,
      status: ShardingStatuses.SUBMITTING_FOR_SHARDING,
    };
  }

  if (
    isAction<SubmittingForShardingFinishedAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingFinished
    )
  ) {
    return {
      ...state,
      isNamespaceSharded: true,
      status: ShardingStatuses.SHARDING,
    };
  }

  if (
    isAction<SubmittingForShardingErroredAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingErrored
    )
  ) {
    return {
      ...state,
      status: ShardingStatuses.UNSHARDED,
    };
  }

  return state;
};

export const fetchClusterShardingData =
  (): GlobalWritesThunkAction<Promise<void>, IsManagedNamespaceFetchedAction> =>
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

      dispatch({
        type: GlobalWritesActionTypes.IsManagedNamespaceFetched,
        isNamespaceManaged,
      });
      if (!isNamespaceManaged) {
        return;
      }
      // TODO (COMPASS-8277): Now fetch the sharding key and possible process error.
    } catch (error) {
      logger.log.error(
        logger.mongoLogId(1_001_000_330),
        'AtlasFetchError',
        'Error fetching cluster sharding data',
        (error as Error).message
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
    | SubmittingForShardingStartedAction
    | SubmittingForShardingFinishedAction
    | SubmittingForShardingErroredAction
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
      type: GlobalWritesActionTypes.SubmittingForShardingStarted,
    });

    try {
      await atlasGlobalWritesService.createShardKey(namespace, data, {
        projectId,
        clusterName,
      });
      dispatch({
        type: GlobalWritesActionTypes.SubmittingForShardingFinished,
      });
    } catch (error) {
      logger.log.error(
        logger.mongoLogId(1_001_000_331),
        'AtlasFetchError',
        'Error creating cluster shard key',
        {
          error: (error as Error).message,
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
        type: GlobalWritesActionTypes.SubmittingForShardingErrored,
      });
    }
  };

export default reducer;
