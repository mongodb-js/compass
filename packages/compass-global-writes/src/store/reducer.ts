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
  ManagedNamespaceFetched = 'global-writes/ManagedNamespaceFetched',
  NamespaceShardingErrorFetched = 'global-writes/NamespaceShardingErrorFetched',
  NamespaceShardKeyFetched = 'global-writes/NamespaceShardKeyFetched',

  ShardZonesFetched = 'global-writes/ShardZonesFetched',

  SubmittingForShardingStarted = 'global-writes/SubmittingForShardingStarted',
  SubmittingForShardingFinished = 'global-writes/SubmittingForShardingFinished',
  SubmittingForShardingErrored = 'global-writes/SubmittingForShardingErrored',

  UnmanagingNamespaceStarted = 'global-writes/UnmanagingNamespaceStarted',
  UnmanagingNamespaceFinished = 'global-writes/UnmanagingNamespaceFinished',
  UnmanagingNamespaceErrored = 'global-writes/UnmanagingNamespaceErrored',
}

type ManagedNamespaceFetchedAction = {
  type: GlobalWritesActionTypes.ManagedNamespaceFetched;
  managedNamespace?: ManagedNamespace;
};

type NamespaceShardingErrorFetchedAction = {
  type: GlobalWritesActionTypes.NamespaceShardingErrorFetched;
  error: string;
};

type NamespaceShardKeyFetchedAction = {
  type: GlobalWritesActionTypes.NamespaceShardKeyFetched;
  shardKey: ShardKey;
};

type ShardZonesFetchedAction = {
  type: GlobalWritesActionTypes.ShardZonesFetched;
  shardZones: ShardZoneData[];
};

type SubmittingForShardingStartedAction = {
  type: GlobalWritesActionTypes.SubmittingForShardingStarted;
};

type SubmittingForShardingFinishedAction = {
  type: GlobalWritesActionTypes.SubmittingForShardingFinished;
  managedNamespace?: ManagedNamespace;
};

type SubmittingForShardingErroredAction = {
  type: GlobalWritesActionTypes.SubmittingForShardingErrored;
};

type UnmanagingNamespaceStartedAction = {
  type: GlobalWritesActionTypes.UnmanagingNamespaceStarted;
};

type UnmanagingNamespaceFinishedAction = {
  type: GlobalWritesActionTypes.UnmanagingNamespaceFinished;
};

type UnmanagingNamespaceErroredAction = {
  type: GlobalWritesActionTypes.UnmanagingNamespaceErrored;
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

  /**
   * Sharding failed.
   */
  SHARDING_ERROR = 'SHARDING_ERROR',

  /**
   * If the first key is not valid location key or the key is not compound.
   */
  SHARD_KEY_INVALID = 'SHARD_KEY_INVALID',

  /**
   * If the first key is valid (location key) and second key is not valid.
   * The second key valid means that it matches with the managedNamespace's
   * customShardKey and is of the correct type.
   */
  SHARD_KEY_MISMATCH = 'SHARD_KEY_MISMATCH',

  /**
   * Namespace is geo-sharded. Both, first key is valid
   * location key and second key is valid custom key.
   */
  SHARD_KEY_CORRECT = 'SHARD_KEY_CORRECT',

  /**
   * Namespace is being unmanaged.
   */
  UNMANAGING_NAMESPACE = 'UNMANAGING_NAMESPACE',
}

export type ShardingStatus = keyof typeof ShardingStatuses;
export type ShardKey = {
  fields: Array<{
    type: 'HASHED' | 'RANGE';
    name: string;
  }>;
  isUnique: boolean;
};
export type ShardZoneData = {
  zoneId: string;
  country: string;
  readableName: string;
  isoCode: string;
  typeOneIsoCode: string;
  zoneName: string;
  zoneLocations: string[];
};
export type RootState = {
  namespace: string;
  managedNamespace?: ManagedNamespace;
  shardZones: ShardZoneData[];
} & (
  | {
      status: ShardingStatuses.NOT_READY;
      shardKey?: never;
      shardingError?: never;
    }
  | {
      status:
        | ShardingStatuses.UNSHARDED
        | ShardingStatuses.SUBMITTING_FOR_SHARDING
        | ShardingStatuses.SHARDING;
      /**
       * note: shardKey might exist even for unsharded.
       * if the collection was sharded previously and then unmanaged
       */
      shardKey?: ShardKey;
      shardingError?: never;
    }
  | {
      status: ShardingStatuses.SHARDING_ERROR;
      shardKey?: never;
      shardingError: string;
    }
  | {
      status:
        | ShardingStatuses.SHARD_KEY_CORRECT
        | ShardingStatuses.SHARD_KEY_INVALID
        | ShardingStatuses.SHARD_KEY_MISMATCH
        | ShardingStatuses.UNMANAGING_NAMESPACE;
      shardKey: ShardKey;
      shardingError?: never;
    }
);

const initialState: RootState = {
  namespace: '',
  status: ShardingStatuses.NOT_READY,
  shardZones: [],
};

const reducer: Reducer<RootState, Action> = (state = initialState, action) => {
  if (
    isAction<ManagedNamespaceFetchedAction>(
      action,
      GlobalWritesActionTypes.ManagedNamespaceFetched
    ) &&
    state.status === ShardingStatuses.NOT_READY
  ) {
    return {
      ...state,
      managedNamespace: action.managedNamespace,
      status: !action.managedNamespace
        ? ShardingStatuses.UNSHARDED
        : state.status,
    };
  }

  if (
    isAction<NamespaceShardingErrorFetchedAction>(
      action,
      GlobalWritesActionTypes.NamespaceShardingErrorFetched
    ) &&
    state.status === ShardingStatuses.NOT_READY
  ) {
    return {
      ...state,
      status: ShardingStatuses.SHARDING_ERROR,
      shardKey: undefined,
      shardingError: action.error,
    };
  }

  if (
    isAction<NamespaceShardKeyFetchedAction>(
      action,
      GlobalWritesActionTypes.NamespaceShardKeyFetched
    ) &&
    state.status === ShardingStatuses.NOT_READY
  ) {
    return {
      ...state,
      status: getStatusFromShardKey(action.shardKey, state.managedNamespace),
      shardKey: action.shardKey,
      shardingError: undefined,
    };
  }

  if (
    isAction<ShardZonesFetchedAction>(
      action,
      GlobalWritesActionTypes.ShardZonesFetched
    )
  ) {
    return {
      ...state,
      shardZones: action.shardZones,
    };
  }

  if (
    isAction<SubmittingForShardingStartedAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingStarted
    ) &&
    state.status === ShardingStatuses.UNSHARDED
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
    ) &&
    state.status === ShardingStatuses.SUBMITTING_FOR_SHARDING
  ) {
    return {
      ...state,
      managedNamespace: action.managedNamespace || state.managedNamespace,
      status: ShardingStatuses.SHARDING,
    };
  }

  if (
    isAction<SubmittingForShardingErroredAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingErrored
    ) &&
    state.status === ShardingStatuses.SUBMITTING_FOR_SHARDING
  ) {
    return {
      ...state,
      managedNamespace: undefined,
      status: ShardingStatuses.UNSHARDED,
    };
  }

  if (
    isAction<UnmanagingNamespaceStartedAction>(
      action,
      GlobalWritesActionTypes.UnmanagingNamespaceStarted
    ) &&
    (state.status === ShardingStatuses.SHARD_KEY_CORRECT ||
      state.status === ShardingStatuses.SHARD_KEY_INVALID ||
      state.status === ShardingStatuses.SHARD_KEY_MISMATCH)
  ) {
    return {
      ...state,
      status: ShardingStatuses.UNMANAGING_NAMESPACE,
    };
  }

  if (
    isAction<UnmanagingNamespaceFinishedAction>(
      action,
      GlobalWritesActionTypes.UnmanagingNamespaceFinished
    ) &&
    state.status === ShardingStatuses.UNMANAGING_NAMESPACE
  ) {
    return {
      ...state,
      managedNamespace: undefined,
      status: ShardingStatuses.UNSHARDED,
    };
  }

  if (
    isAction<UnmanagingNamespaceErroredAction>(
      action,
      GlobalWritesActionTypes.UnmanagingNamespaceErrored
    ) &&
    state.status === ShardingStatuses.UNMANAGING_NAMESPACE
  ) {
    return {
      ...state,
      status: ShardingStatuses.SHARD_KEY_CORRECT,
    };
  }

  return state;
};

export const fetchClusterShardingData =
  (): GlobalWritesThunkAction<Promise<void>, ManagedNamespaceFetchedAction> =>
  async (
    dispatch,
    getState,
    { atlasGlobalWritesService, logger, connectionInfoRef }
  ) => {
    const { namespace } = getState();
    try {
      // Call the API to check if the namespace is managed. If the namespace is managed,
      // we would want to fetch more data that is needed to figure out the state and
      // accordingly show the UI to the user.
      const managedNamespace =
        await atlasGlobalWritesService.getManagedNamespace(namespace);

      dispatch({
        type: GlobalWritesActionTypes.ManagedNamespaceFetched,
        managedNamespace,
      });
      if (!managedNamespace) {
        return;
      }

      // At this point, the namespace is managed and we want to fetch the sharding key.
      void dispatch(fetchNamespaceShardKey());
    } catch (error) {
      logger.log.error(
        logger.mongoLogId(1_001_000_330),
        'AtlasFetchError',
        'Error fetching cluster sharding data',
        (error as Error).message
      );
      openToast(
        `global-writes-fetch-shard-info-error-${connectionInfoRef.current.id}-${namespace}`,
        {
          title: `Failed to fetch sharding information: ${
            (error as Error).message
          }`,
          dismissible: true,
          timeout: 5000,
          variant: 'important',
        }
      );
    }
  };

export const createShardKey = (
  data: CreateShardKeyData
): GlobalWritesThunkAction<
  Promise<void>,
  | SubmittingForShardingStartedAction
  | SubmittingForShardingFinishedAction
  | SubmittingForShardingErroredAction
> => {
  return async (
    dispatch,
    getState,
    { atlasGlobalWritesService, logger, connectionInfoRef }
  ) => {
    const { namespace } = getState();
    dispatch({
      type: GlobalWritesActionTypes.SubmittingForShardingStarted,
    });

    try {
      const managedNamespace = await atlasGlobalWritesService.createShardKey(
        namespace,
        data
      );
      dispatch(setNamespaceBeingSharded(managedNamespace));
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
      openToast(
        `global-writes-create-shard-key-error-${connectionInfoRef.current.id}-${namespace}`,
        {
          title: `Failed to create shard key: ${(error as Error).message}`,
          dismissible: true,
          timeout: 5000,
          variant: 'important',
        }
      );
      dispatch({
        type: GlobalWritesActionTypes.SubmittingForShardingErrored,
      });
    }
  };
};

const setNamespaceBeingSharded = (
  managedNamespace?: ManagedNamespace
): GlobalWritesThunkAction<void, SubmittingForShardingFinishedAction> => {
  return (dispatch) => {
    dispatch({
      type: GlobalWritesActionTypes.SubmittingForShardingFinished,
      managedNamespace,
    });
  };
};

export const fetchNamespaceShardKey = (): GlobalWritesThunkAction<
  Promise<void>,
  NamespaceShardingErrorFetchedAction | NamespaceShardKeyFetchedAction
> => {
  return async (
    dispatch,
    getState,
    { atlasGlobalWritesService, logger, connectionInfoRef }
  ) => {
    const { namespace } = getState();

    try {
      const [shardingError, shardKey] = await Promise.all([
        atlasGlobalWritesService.getShardingError(namespace),
        atlasGlobalWritesService.getShardingKeys(namespace),
      ]);

      if (shardingError) {
        dispatch({
          type: GlobalWritesActionTypes.NamespaceShardingErrorFetched,
          error: shardingError,
        });
        return;
      }

      if (!shardKey) {
        dispatch(setNamespaceBeingSharded());
        return;
      }

      dispatch({
        type: GlobalWritesActionTypes.NamespaceShardKeyFetched,
        shardKey,
      });
      void dispatch(fetchShardingZones());
    } catch (error) {
      logger.log.error(
        logger.mongoLogId(1_001_000_333),
        'AtlasFetchError',
        'Error fetching shard key',
        (error as Error).message
      );
      openToast(
        `global-writes-fetch-shard-key-error-${connectionInfoRef.current.id}-${namespace}`,
        {
          title: `Failed to fetch shard key: ${(error as Error).message}`,
          dismissible: true,
          timeout: 5000,
          variant: 'important',
        }
      );
    }
  };
};

export const fetchShardingZones = (): GlobalWritesThunkAction<
  Promise<void>,
  ShardZonesFetchedAction
> => {
  return async (dispatch, getState, { atlasGlobalWritesService }) => {
    const { shardZones } = getState();
    if (shardZones.length > 0) {
      return;
    }
    const shardingZones = await atlasGlobalWritesService.getShardingZones();
    dispatch({
      type: GlobalWritesActionTypes.ShardZonesFetched,
      shardZones: shardingZones,
    });
  };
};

export const unmanageNamespace = (): GlobalWritesThunkAction<
  Promise<void>,
  | UnmanagingNamespaceStartedAction
  | UnmanagingNamespaceFinishedAction
  | UnmanagingNamespaceErroredAction
> => {
  return async (
    dispatch,
    getState,
    { atlasGlobalWritesService, connectionInfoRef }
  ) => {
    const { namespace } = getState();

    dispatch({
      type: GlobalWritesActionTypes.UnmanagingNamespaceStarted,
    });

    try {
      await atlasGlobalWritesService.unmanageNamespace(namespace);
      dispatch({
        type: GlobalWritesActionTypes.UnmanagingNamespaceFinished,
      });
    } catch (error) {
      dispatch({
        type: GlobalWritesActionTypes.UnmanagingNamespaceErrored,
      });
      openToast(
        `global-writes-unmanage-namespace-error-${connectionInfoRef.current.id}-${namespace}`,
        {
          title: `Failed to unmanage namespace: ${(error as Error).message}`,
          dismissible: true,
          timeout: 5000,
          variant: 'important',
        }
      );
    }
  };
};

export function getStatusFromShardKey(
  shardKey: ShardKey,
  managedNamespace?: ManagedNamespace
) {
  const [firstShardKey, secondShardKey] = shardKey.fields;

  // For a shard key to be valid:
  // 1. The first key must be location and of type RANGE.
  // 2. The second key name must match managedNamespace.customShardKey and
  //   the type must match the managedNamespace.isCustomShardKeyHashed.

  const isLocatonKeyValid =
    firstShardKey.name === 'location' && firstShardKey.type === 'RANGE';
  const isCustomKeyValid =
    managedNamespace &&
    managedNamespace.isShardKeyUnique === shardKey.isUnique &&
    secondShardKey.name === managedNamespace.customShardKey &&
    secondShardKey.type ===
      (managedNamespace.isCustomShardKeyHashed ? 'HASHED' : 'RANGE');

  if (!isLocatonKeyValid || !secondShardKey) {
    return ShardingStatuses.SHARD_KEY_INVALID;
  }

  if (!isCustomKeyValid) {
    return ShardingStatuses.SHARD_KEY_MISMATCH;
  }

  return ShardingStatuses.SHARD_KEY_CORRECT;
}

export default reducer;
