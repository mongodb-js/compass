import type { Action, Reducer } from 'redux';
import type { GlobalWritesThunkAction } from '.';
import {
  openToast,
  showConfirmation as showConfirmationModal,
} from '@mongodb-js/compass-components';
import type { ManagedNamespace } from '../services/atlas-global-writes-service';

export const POLLING_INTERVAL = 5000;

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

  CancellingShardingStarted = 'global-writes/CancellingShardingStarted',
  CancellingShardingFinished = 'global-writes/CancellingShardingFinished',
  CancellingShardingErrored = 'global-writes/CancellingShardingErrored',

  NextPollingTimeoutSet = 'global-writes/NextPollingTimeoutSet',
  NextPollingTimeoutCleared = 'global-writes/NextPollingTimeoutCleared',

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

type CancellingShardingStartedAction = {
  type: GlobalWritesActionTypes.CancellingShardingStarted;
};

type CancellingShardingFinishedAction = {
  type: GlobalWritesActionTypes.CancellingShardingFinished;
  managedNamespace?: ManagedNamespace;
};

type CancellingShardingErroredAction = {
  type: GlobalWritesActionTypes.CancellingShardingErrored;
};

type NextPollingTimeoutSetAction = {
  type: GlobalWritesActionTypes.NextPollingTimeoutSet;
  timeout: NodeJS.Timeout;
};

type NextPollingTimeoutClearedAction = {
  type: GlobalWritesActionTypes.NextPollingTimeoutCleared;
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
  SUBMITTING_FOR_SHARDING_ERROR = 'SUBMITTING_FOR_SHARDING_ERROR',

  /**
   * Namespace is being sharded.
   */
  SHARDING = 'SHARDING',

  /**
   * State when user cancels the sharding and
   * we are waiting for server to accept the request.
   */
  CANCELLING_SHARDING = 'CANCELLING_SHARDING',
  CANCELLING_SHARDING_ERROR = 'CANCELLING_SHARDING_ERROR',

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
  UNMANAGING_NAMESPACE_MISMATCH = 'UNMANAGING_NAMESPACE_MISMATCH',
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
      pollingTimeout?: never;
    }
  | {
      status:
        | ShardingStatuses.UNSHARDED
        | ShardingStatuses.SUBMITTING_FOR_SHARDING
        | ShardingStatuses.CANCELLING_SHARDING;
      /**
       * note: shardKey might exist even for unsharded.
       * if the collection was sharded previously and then unmanaged
       */
      shardKey?: ShardKey;
      shardingError?: never;
      pollingTimeout?: never;
    }
  | {
      status: ShardingStatuses.SHARDING;
      /**
       * note: shardKey might exist
       * if the collection was sharded previously and then unmanaged
       */
      shardKey?: ShardKey;
      shardingError?: never;
      pollingTimeout?: NodeJS.Timeout;
    }
  | {
      status:
        | ShardingStatuses.SHARDING_ERROR
        | ShardingStatuses.CANCELLING_SHARDING_ERROR
        | ShardingStatuses.SUBMITTING_FOR_SHARDING_ERROR;
      shardKey?: never;
      shardingError: string;
      pollingTimeout?: never;
    }
  | {
      status:
        | ShardingStatuses.SHARD_KEY_CORRECT
        | ShardingStatuses.SHARD_KEY_INVALID
        | ShardingStatuses.SHARD_KEY_MISMATCH
        | ShardingStatuses.UNMANAGING_NAMESPACE
        | ShardingStatuses.UNMANAGING_NAMESPACE_MISMATCH;
      shardKey: ShardKey;
      shardingError?: never;
      pollingTimeout?: never;
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
    (state.status === ShardingStatuses.NOT_READY ||
      state.status === ShardingStatuses.SHARDING)
  ) {
    if (state.pollingTimeout) {
      throw new Error('Polling was not stopped');
    }
    return {
      ...state,
      status: ShardingStatuses.SHARDING_ERROR,
      shardKey: undefined,
      shardingError: action.error,
      pollingTimeout: state.pollingTimeout,
    };
  }

  if (
    isAction<NamespaceShardKeyFetchedAction>(
      action,
      GlobalWritesActionTypes.NamespaceShardKeyFetched
    ) &&
    (state.status === ShardingStatuses.NOT_READY ||
      state.status === ShardingStatuses.SHARDING)
  ) {
    if (state.pollingTimeout) {
      throw new Error('Polling was not stopped');
    }
    return {
      ...state,
      status: getStatusFromShardKey(action.shardKey, state.managedNamespace),
      shardKey: action.shardKey,
      shardingError: undefined,
      pollingTimeout: state.pollingTimeout,
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
    isAction<SubmittingForShardingStartedAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingStarted
    ) &&
    state.status === ShardingStatuses.SHARDING_ERROR
  ) {
    return {
      ...state,
      status: ShardingStatuses.SUBMITTING_FOR_SHARDING_ERROR,
    };
  }

  if (
    isAction<SubmittingForShardingFinishedAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingFinished
    ) &&
    (state.status === ShardingStatuses.SUBMITTING_FOR_SHARDING ||
      state.status === ShardingStatuses.SUBMITTING_FOR_SHARDING_ERROR ||
      state.status === ShardingStatuses.NOT_READY)
  ) {
    return {
      ...state,
      shardingError: undefined,
      managedNamespace: action.managedNamespace || state.managedNamespace,
      status: ShardingStatuses.SHARDING,
    };
  }

  if (
    isAction<NextPollingTimeoutSetAction>(
      action,
      GlobalWritesActionTypes.NextPollingTimeoutSet
    ) &&
    state.status === ShardingStatuses.SHARDING
  ) {
    return {
      ...state,
      pollingTimeout: action.timeout,
    };
  }

  if (
    isAction<NextPollingTimeoutClearedAction>(
      action,
      GlobalWritesActionTypes.NextPollingTimeoutCleared
    ) &&
    state.status === ShardingStatuses.SHARDING
  ) {
    return {
      ...state,
      pollingTimeout: undefined,
    };
  }

  if (
    isAction<CancellingShardingStartedAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingStarted
    ) &&
    state.status === ShardingStatuses.SHARDING
  ) {
    if (state.pollingTimeout) {
      throw new Error('Polling was not stopped');
    }
    return {
      ...state,
      status: ShardingStatuses.CANCELLING_SHARDING,
      pollingTimeout: state.pollingTimeout,
    };
  }

  if (
    isAction<CancellingShardingStartedAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingStarted
    ) &&
    state.status === ShardingStatuses.SHARDING_ERROR
  ) {
    return {
      ...state,
      status: ShardingStatuses.CANCELLING_SHARDING_ERROR,
    };
  }

  if (
    isAction<CancellingShardingErroredAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingErrored
    ) &&
    (state.status === ShardingStatuses.CANCELLING_SHARDING ||
      state.status === ShardingStatuses.CANCELLING_SHARDING_ERROR)
  ) {
    return {
      ...state,
      shardingError: undefined,
      status: ShardingStatuses.SHARDING,
    };
  }

  if (
    isAction<CancellingShardingFinishedAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingFinished
    ) &&
    (state.status === ShardingStatuses.CANCELLING_SHARDING ||
      state.status === ShardingStatuses.SHARDING_ERROR ||
      state.status === ShardingStatuses.CANCELLING_SHARDING_ERROR)
    // the error might come before the cancel request was processed
  ) {
    return {
      ...state,
      status: ShardingStatuses.UNSHARDED,
      shardingError: undefined,
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
      state.status === ShardingStatuses.SHARD_KEY_MISMATCH)
  ) {
    return {
      ...state,
      status:
        state.status === ShardingStatuses.SHARD_KEY_CORRECT
          ? ShardingStatuses.UNMANAGING_NAMESPACE
          : ShardingStatuses.UNMANAGING_NAMESPACE_MISMATCH,
    };
  }

  if (
    isAction<UnmanagingNamespaceFinishedAction>(
      action,
      GlobalWritesActionTypes.UnmanagingNamespaceFinished
    ) &&
    (state.status === ShardingStatuses.UNMANAGING_NAMESPACE ||
      state.status === ShardingStatuses.UNMANAGING_NAMESPACE_MISMATCH)
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

// Exporting this for test only to stub it and set
// its value. This enables to test cancelSharding action.
export const showConfirmation = showConfirmationModal;

export const cancelSharding = (): GlobalWritesThunkAction<
  Promise<void>,
  | CancellingShardingStartedAction
  | CancellingShardingFinishedAction
  | CancellingShardingErroredAction
> => {
  return async (dispatch, getState, { atlasGlobalWritesService, logger }) => {
    const confirmed = await showConfirmation({
      title: 'Confirmation',
      description: 'Are you sure you want to cancel the sharding request?',
    });

    if (!confirmed) {
      return;
    }

    const { namespace, status } = getState();

    if (status === ShardingStatuses.SHARDING) {
      dispatch(stopPollingForShardKey());
    }
    dispatch({
      type: GlobalWritesActionTypes.CancellingShardingStarted,
    });

    try {
      await atlasGlobalWritesService.unmanageNamespace(namespace);
      dispatch({
        type: GlobalWritesActionTypes.CancellingShardingFinished,
      });
    } catch (error) {
      logger.log.error(
        logger.mongoLogId(1_001_000_334),
        'AtlasFetchError',
        'Error cancelling the sharding process',
        {
          error: (error as Error).message,
        }
      );
      openToast('global-writes-cancel-sharding-error', {
        title: `Failed to cancel the sharding process: ${
          (error as Error).message
        }`,
        dismissible: true,
        timeout: 5000,
        variant: 'important',
      });
      dispatch({
        type: GlobalWritesActionTypes.CancellingShardingErrored,
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
    dispatch(pollForShardKey());
  };
};

const pollForShardKey = (): GlobalWritesThunkAction<
  void,
  NextPollingTimeoutSetAction
> => {
  return (dispatch, getState) => {
    const { pollingTimeout } = getState();
    if (
      pollingTimeout // prevent double polling
    ) {
      return;
    }
    const timeout = setTimeout(() => {
      void dispatch(fetchNamespaceShardKey());
    }, POLLING_INTERVAL);

    dispatch({
      type: GlobalWritesActionTypes.NextPollingTimeoutSet,
      timeout,
    });
  };
};

const stopPollingForShardKey = (): GlobalWritesThunkAction<
  void,
  NextPollingTimeoutClearedAction
> => {
  return (dispatch, getState) => {
    const { pollingTimeout } = getState();
    if (!pollingTimeout) return;
    clearTimeout(pollingTimeout);
    dispatch({ type: GlobalWritesActionTypes.NextPollingTimeoutCleared });
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
    const { namespace, status } = getState();

    try {
      const [shardingError, shardKey] = await Promise.all([
        atlasGlobalWritesService.getShardingError(namespace),
        atlasGlobalWritesService.getShardingKeys(namespace),
      ]);

      if (shardingError && !shardKey) {
        // if there is an existing shard key and an error both,
        // means we have a key mismatch
        // this will be handled in NamespaceShardKeyFetched
        if (status === ShardingStatuses.SHARDING) {
          dispatch(stopPollingForShardKey());
        }
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

      if (status === ShardingStatuses.SHARDING) {
        dispatch(stopPollingForShardKey());
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
