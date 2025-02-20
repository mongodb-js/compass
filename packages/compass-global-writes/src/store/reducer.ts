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
  ShardZonesFetchedError = 'global-writes/ShardZonesFetchedError',

  SubmittingForShardingStarted = 'global-writes/SubmittingForShardingStarted',
  SubmittingForShardingFinished = 'global-writes/SubmittingForShardingFinished',
  SubmittingForShardingErrored = 'global-writes/SubmittingForShardingErrored',

  CancellingShardingStarted = 'global-writes/CancellingShardingStarted',
  CancellingShardingFinished = 'global-writes/CancellingShardingFinished',
  CancellingShardingErrored = 'global-writes/CancellingShardingErrored',

  UnmanagingNamespaceStarted = 'global-writes/UnmanagingNamespaceStarted',
  UnmanagingNamespaceFinished = 'global-writes/UnmanagingNamespaceFinished',
  UnmanagingNamespaceErrored = 'global-writes/UnmanagingNamespaceErrored',

  LoadingFailed = 'global-writes/LoadingFailed',
}

type ManagedNamespaceFetchedAction = {
  type: GlobalWritesActionTypes.ManagedNamespaceFetched;
  managedNamespace?: ManagedNamespace;
};

type LoadingFailedAction = {
  type: GlobalWritesActionTypes.LoadingFailed;
  error: string;
};

type NamespaceShardingErrorFetchedAction = {
  type: GlobalWritesActionTypes.NamespaceShardingErrorFetched;
  error: string;
};

type NamespaceShardKeyFetchedAction = {
  type: GlobalWritesActionTypes.NamespaceShardKeyFetched;
  shardKey?: ShardKey;
};

type ShardZonesFetchedAction = {
  type: GlobalWritesActionTypes.ShardZonesFetched;
  shardZones: ShardZoneData[];
};

type ShardZonesFetchedErrorAction = {
  type: GlobalWritesActionTypes.ShardZonesFetchedError;
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
   * The status could not be determined because loading failed
   */
  LOADING_ERROR = 'LOADING_ERROR',

  /**
   * Namespace is not geo-sharded.
   */
  UNSHARDED = 'UNSHARDED',

  /**
   * Incomplete sharding setup
   * sharding key exists but namespace is not managed
   * (can happen when already sharded namespace is unmanaged)
   */
  INCOMPLETE_SHARDING_SETUP = 'INCOMPLETE_SHARDING_SETUP',

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
      status: ShardingStatuses.LOADING_ERROR;
      shardKey?: ShardKey;
      loadingError: string;
      //////////////
      userActionInProgress?: never;
      shardingError?: never;
    }
  | {
      status: ShardingStatuses.NOT_READY;
      //////////////
      userActionInProgress?: never;
      shardKey?: never;
      shardingError?: never;
      loadingError?: never;
    }
  | {
      status: ShardingStatuses.UNSHARDED;
      userActionInProgress?: 'submitForSharding';
      //////////////
      shardKey?: never;
      shardingError?: never;
      loadingError?: never;
    }
  | {
      status: ShardingStatuses.SHARDING;
      userActionInProgress?: 'cancelSharding';
      /**
       * note: shardKey might exist
       * if the collection was sharded previously and then unmanaged
       */
      shardKey?: ShardKey;
      //////////////
      shardingError?: never;
      loadingError?: never;
    }
  | {
      status: ShardingStatuses.SHARDING_ERROR;
      userActionInProgress?: 'cancelSharding' | 'submitForSharding';
      shardingError: string;
      //////////////
      shardKey?: never;
      loadingError?: never;
    }
  | {
      status:
        | ShardingStatuses.SHARD_KEY_CORRECT
        | ShardingStatuses.SHARD_KEY_MISMATCH;
      userActionInProgress?: 'unmanageNamespace';
      shardKey: ShardKey;
      //////////////
      shardingError?: never;
      loadingError?: never;
    }
  | {
      status: ShardingStatuses.SHARD_KEY_INVALID;
      shardKey: ShardKey;
      //////////////
      userActionInProgress?: never;
      shardingError?: never;
      loadingError?: never;
    }
  | {
      status: ShardingStatuses.INCOMPLETE_SHARDING_SETUP;
      userActionInProgress?: 'cancelSharding' | 'submitForSharding';
      shardKey: ShardKey;
      //////////////
      shardingError?: never;
      loadingError?: never;
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
    (state.status === ShardingStatuses.NOT_READY ||
      state.status === ShardingStatuses.SHARDING) &&
    action.shardKey
  ) {
    return {
      ...state,
      status: getStatusFromShardKeyAndManaged(
        action.shardKey,
        state.managedNamespace
      ),
      userActionInProgress: undefined,
      shardKey: action.shardKey,
      shardingError: undefined,
    };
  }

  if (
    isAction<NamespaceShardKeyFetchedAction>(
      action,
      GlobalWritesActionTypes.NamespaceShardKeyFetched
    ) &&
    state.status === ShardingStatuses.NOT_READY &&
    !action.shardKey &&
    !state.managedNamespace
  ) {
    return {
      ...state,
      status: ShardingStatuses.UNSHARDED,
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
    isAction<ShardZonesFetchedErrorAction>(
      action,
      GlobalWritesActionTypes.ShardZonesFetchedError
    )
  ) {
    return {
      ...state,
      shardZones: [],
    };
  }

  if (
    isAction<CancellingShardingErroredAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingErrored
    ) ||
    isAction<UnmanagingNamespaceErroredAction>(
      action,
      GlobalWritesActionTypes.UnmanagingNamespaceErrored
    ) ||
    isAction<SubmittingForShardingErroredAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingErrored
    )
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
    };
  }

  if (
    isAction<SubmittingForShardingStartedAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingStarted
    ) &&
    (state.status === ShardingStatuses.UNSHARDED ||
      state.status === ShardingStatuses.SHARDING_ERROR ||
      state.status === ShardingStatuses.INCOMPLETE_SHARDING_SETUP)
  ) {
    return {
      ...state,
      userActionInProgress: 'submitForSharding',
    };
  }

  if (
    isAction<SubmittingForShardingFinishedAction>(
      action,
      GlobalWritesActionTypes.SubmittingForShardingFinished
    ) &&
    (state.status === ShardingStatuses.UNSHARDED ||
      state.status === ShardingStatuses.SHARDING_ERROR ||
      state.status === ShardingStatuses.INCOMPLETE_SHARDING_SETUP ||
      state.status === ShardingStatuses.NOT_READY)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      shardingError: undefined,
      managedNamespace: action.managedNamespace || state.managedNamespace,
      status: ShardingStatuses.SHARDING,
    };
  }

  if (
    isAction<CancellingShardingStartedAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingStarted
    ) &&
    (state.status === ShardingStatuses.SHARDING ||
      state.status === ShardingStatuses.SHARDING_ERROR ||
      state.status === ShardingStatuses.INCOMPLETE_SHARDING_SETUP)
  ) {
    return {
      ...state,
      userActionInProgress: 'cancelSharding',
    };
  }

  if (
    isAction<CancellingShardingFinishedAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingFinished
    ) &&
    (state.status === ShardingStatuses.SHARDING ||
      state.status === ShardingStatuses.SHARDING_ERROR) &&
    !state.shardKey
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      managedNamespace: undefined,
      shardKey: state.shardKey,
      shardingError: undefined,
      status: ShardingStatuses.UNSHARDED,
    };
  }

  if (
    isAction<CancellingShardingFinishedAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingFinished
    ) &&
    state.status === ShardingStatuses.SHARDING &&
    state.shardKey
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      managedNamespace: undefined,
      shardKey: state.shardKey,
      shardingError: undefined,
      status: ShardingStatuses.INCOMPLETE_SHARDING_SETUP,
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
      userActionInProgress: 'unmanageNamespace',
    };
  }

  if (
    isAction<UnmanagingNamespaceFinishedAction>(
      action,
      GlobalWritesActionTypes.UnmanagingNamespaceFinished
    ) &&
    (state.status === ShardingStatuses.SHARD_KEY_CORRECT ||
      state.status === ShardingStatuses.SHARD_KEY_MISMATCH)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      managedNamespace: undefined,
      status: ShardingStatuses.INCOMPLETE_SHARDING_SETUP,
    };
  }

  if (
    isAction<LoadingFailedAction>(
      action,
      GlobalWritesActionTypes.LoadingFailed
    ) &&
    (state.status === ShardingStatuses.NOT_READY ||
      state.status === ShardingStatuses.SHARDING)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      status: ShardingStatuses.LOADING_ERROR,
      loadingError: action.error,
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
      const managedNamespace =
        await atlasGlobalWritesService.getManagedNamespace(namespace);

      dispatch({
        type: GlobalWritesActionTypes.ManagedNamespaceFetched,
        managedNamespace,
      });

      void dispatch(fetchNamespaceShardKey());
    } catch (error) {
      logger.log.error(
        logger.mongoLogId(1_001_000_330),
        'AtlasFetchError',
        'Error fetching cluster sharding data',
        (error as Error).message
      );
      dispatch(
        handleLoadingError({
          error: error as Error,
          id: `global-writes-fetch-shard-info-error-${connectionInfoRef.current.id}-${namespace}`,
          description: 'Failed to fetch sharding information',
        })
      );
    }
  };

export const resumeManagedNamespace = (): ReturnType<typeof createShardKey> => {
  return async (dispatch, getState) => {
    const { shardKey } = getState();
    if (!shardKey) {
      throw new Error('Cannot resume managed namespace without a shardKey');
    }
    const data: CreateShardKeyData = {
      customShardKey: shardKey.fields[1].name,
      isShardKeyUnique: shardKey.isUnique,
      isCustomShardKeyHashed: shardKey.fields[1].type === 'HASHED',
      numInitialChunks: null, // default
      presplitHashedZones: false, // default
    };
    await dispatch(createShardKey(data));
  };
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
    const { namespace, userActionInProgress } = getState();

    if (userActionInProgress) {
      logger.log.warn(
        logger.mongoLogId(1_001_000_337),
        'Global writes duplicate action',
        `SubmittingForSharding triggered while another action is in progress - ${userActionInProgress}`
      );
      return;
    }

    dispatch({
      type: GlobalWritesActionTypes.SubmittingForShardingStarted,
    });

    try {
      const managedNamespace = await atlasGlobalWritesService.manageNamespace(
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
// its value. This enables to test cancelShardingaction.
export const showConfirmation = showConfirmationModal;

export const cancelSharding = (): GlobalWritesThunkAction<
  Promise<void>,
  | CancellingShardingStartedAction
  | CancellingShardingFinishedAction
  | CancellingShardingErroredAction
> => {
  return async (
    dispatch,
    getState,
    { atlasGlobalWritesService, logger, pollingTimeoutRef }
  ) => {
    const confirmed = await showConfirmation({
      title: 'Confirmation',
      description: 'Are you sure you want to cancel the sharding request?',
    });

    if (!confirmed) {
      return;
    }

    const { namespace, status, userActionInProgress } = getState();

    if (userActionInProgress) {
      logger.log.warn(
        logger.mongoLogId(1_001_000_335),
        'Global writes duplicate action',
        `CancelSharding triggered while another action is in progress - ${userActionInProgress}`
      );
      return;
    }

    if (status === ShardingStatuses.SHARDING) {
      stopPollingForShardKey(pollingTimeoutRef);
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
  FetchNamespaceShardKeyActions
> => {
  return (dispatch, getState, { pollingTimeoutRef }) => {
    if (
      pollingTimeoutRef.current // prevent double polling
    ) {
      return;
    }
    pollingTimeoutRef.current = setTimeout(() => {
      void dispatch(fetchNamespaceShardKey());
    }, POLLING_INTERVAL);
  };
};

const stopPollingForShardKey = (pollingTimeoutRef: {
  current: ReturnType<typeof setTimeout> | null;
}) => {
  if (!pollingTimeoutRef.current) return;
  clearTimeout(pollingTimeoutRef.current);
};

const handleLoadingError = ({
  error,
  id,
  description,
}: {
  error: Error;
  id: string;
  description: string;
}): GlobalWritesThunkAction<void, LoadingFailedAction> => {
  return (dispatch, getState) => {
    const { status } = getState();
    const isPolling = status === ShardingStatuses.SHARDING;
    const isInitialLoad = status === ShardingStatuses.NOT_READY;
    const errorMessage = `${description}: ${error.message}`;
    if (isInitialLoad || isPolling) {
      dispatch({
        type: GlobalWritesActionTypes.LoadingFailed,
        error: errorMessage,
      });
      return;
    }
    openToast(id, {
      title: errorMessage,
      dismissible: true,
      timeout: 5000,
      variant: 'important',
    });
  };
};

type FetchNamespaceShardKeyActions =
  | NamespaceShardingErrorFetchedAction
  | NamespaceShardKeyFetchedAction;

export const fetchNamespaceShardKey = (): GlobalWritesThunkAction<
  Promise<void>,
  FetchNamespaceShardKeyActions
> => {
  return async (
    dispatch,
    getState,
    { atlasGlobalWritesService, logger, connectionInfoRef, pollingTimeoutRef }
  ) => {
    pollingTimeoutRef.current = null;
    const { namespace, managedNamespace } = getState();

    try {
      const [shardingError, shardKey] = await Promise.all([
        atlasGlobalWritesService.getShardingError(namespace),
        atlasGlobalWritesService.getShardingKeys(namespace),
      ]);

      if (managedNamespace && !shardKey) {
        if (!shardingError) {
          // Since the namespace is managed, Atlas has been instructed to shard this collection,
          // and since there is no shard key and no sharding error, the shard must still be in progress
          dispatch(setNamespaceBeingSharded());
          return;
        }
        // if there is an existing shard key and an error both,
        // means we have a key mismatch
        // this will be handled in NamespaceShardKeyFetched
        dispatch({
          type: GlobalWritesActionTypes.NamespaceShardingErrorFetched,
          error: shardingError,
        });
        return;
      }

      dispatch({
        type: GlobalWritesActionTypes.NamespaceShardKeyFetched,
        shardKey,
      });
      // if there is a key, we fetch sharding zones
      if (!shardKey) return;
      void dispatch(fetchShardingZones());
    } catch (error) {
      logger.log.error(
        logger.mongoLogId(1_001_000_333),
        'AtlasFetchError',
        'Error fetching shard key / deployment status',
        (error as Error).message
      );
      dispatch(
        handleLoadingError({
          error: error as Error,
          id: `global-writes-fetch-shard-key-error-${connectionInfoRef.current.id}-${namespace}`,
          description: 'Failed to fetch shard key or deployment status',
        })
      );
    }
  };
};

export const fetchShardingZones = (): GlobalWritesThunkAction<
  Promise<void>,
  ShardZonesFetchedAction | ShardZonesFetchedErrorAction
> => {
  return async (
    dispatch,
    getState,
    { atlasGlobalWritesService, connectionInfoRef }
  ) => {
    const { shardZones } = getState();
    if (shardZones.length > 0) {
      return;
    }
    try {
      const shardingZones = await atlasGlobalWritesService.getShardingZones();
      dispatch({
        type: GlobalWritesActionTypes.ShardZonesFetched,
        shardZones: shardingZones,
      });
    } catch (error) {
      dispatch({
        type: GlobalWritesActionTypes.ShardZonesFetchedError,
      });
      openToast(
        `global-writes-fetch-sharding-zones-error-${connectionInfoRef.current.id}`,
        {
          title: `Failed to fetch sharding zones: ${(error as Error).message}`,
          dismissible: true,
          timeout: 5000,
          variant: 'important',
        }
      );
    }
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
    { atlasGlobalWritesService, connectionInfoRef, logger }
  ) => {
    const { namespace, userActionInProgress } = getState();

    if (userActionInProgress) {
      logger.log.warn(
        logger.mongoLogId(1_001_000_336),
        'Global writes duplicate action',
        `UnmanageNamespace triggered while another action is in progress - ${userActionInProgress}`
      );
      return;
    }

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

export function getStatusFromShardKeyAndManaged(
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

  if (!isLocatonKeyValid || !secondShardKey) {
    return ShardingStatuses.SHARD_KEY_INVALID;
  }

  if (!managedNamespace) {
    return ShardingStatuses.INCOMPLETE_SHARDING_SETUP;
  }

  const isCustomKeyValid =
    managedNamespace &&
    managedNamespace.isShardKeyUnique === shardKey.isUnique &&
    secondShardKey.name === managedNamespace.customShardKey &&
    secondShardKey.type ===
      (managedNamespace.isCustomShardKeyHashed ? 'HASHED' : 'RANGE');

  if (!isCustomKeyValid) {
    return ShardingStatuses.SHARD_KEY_MISMATCH;
  }

  return ShardingStatuses.SHARD_KEY_CORRECT;
}

export default reducer;
