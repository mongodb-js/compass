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

export const getStatus = (state: RootState): ShardingStatuses => {
  const { managedNamespace, shardKey, shardingError, loadingError, isReady } =
    state;

  if (!isReady) return ShardingStatuses.NOT_READY;
  if (loadingError) return ShardingStatuses.LOADING_ERROR;
  if (!managedNamespace) {
    return shardKey
      ? ShardingStatuses.INCOMPLETE_SHARDING_SETUP
      : ShardingStatuses.UNSHARDED;
  }
  if (!shardKey) {
    return shardingError
      ? ShardingStatuses.SHARDING_ERROR
      : ShardingStatuses.SHARDING;
  }
  return getStatusFromShardKeyAndManaged(shardKey, managedNamespace);
  // note: this does not allow for 'sharding' after 'incomplete'.
  // a move which does not make sense to me anyway
  // but it used to be a thing
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
  isReady: boolean;
  shardKey?: ShardKey;
  loadingError?: string;
  userActionInProgress?:
    | 'submitForSharding'
    | 'cancelSharding'
    | 'unmanageNamespace';
  shardingError?: string;
} & (
  | {
      // LOADING_ERROR
      shardKey?: ShardKey;
      shardingError?: string;
      loadingError: string;
      //////////////
      // userActionInProgress?: never;
    }
  | {
      // NOT_READY
      //////////////
      // userActionInProgress?: never;
      shardKey?: never;
      shardingError?: never;
      loadingError?: never;
    }
  | {
      // UNSHARDED
      // userActionInProgress?: 'submitForSharding';
      //////////////
      shardKey?: never;
      shardingError?: never;
      loadingError?: never;
    }
  | {
      // SHARDING
      // userActionInProgress?: 'cancelSharding';
      /**
       * note: shardKey might exist
       * if the collection was sharded previously and then unmanaged
       */
      shardKey: ShardKey; // TODO ?
      //////////////
      shardingError?: never;
      loadingError?: never;
    }
  | {
      // SHARDING_ERROR
      // userActionInProgress?: 'cancelSharding' | 'submitForSharding';
      shardingError: string;
      //////////////
      shardKey?: never;
      loadingError?: never;
    }
  | {
      // SHARD_KEY_CORRECT | SHARD_KEY_MISMATCH
      // userActionInProgress?: 'unmanageNamespace';
      shardKey: ShardKey;
      //////////////
      shardingError?: never;
      loadingError?: never;
    }
  | {
      // SHARD_KEY_INVALID
      shardKey: ShardKey;
      //////////////
      userActionInProgress?: never;
      shardingError?: never;
      loadingError?: never;
    }
  | {
      // INCOMPLETE_SHARDING_SETUP
      // userActionInProgress?: 'cancelSharding' | 'submitForSharding';
      shardKey: ShardKey;
      //////////////
      shardingError?: never;
      loadingError?: never;
    }
);

const initialState: RootState = {
  namespace: '',
  shardZones: [],
  isReady: false,
};

const reducer: Reducer<RootState, Action> = (state = initialState, action) => {
  const status = getStatus(state);

  if (
    isAction<ManagedNamespaceFetchedAction>(
      action,
      GlobalWritesActionTypes.ManagedNamespaceFetched
    ) &&
    status === ShardingStatuses.NOT_READY
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
    (status === ShardingStatuses.NOT_READY ||
      status === ShardingStatuses.SHARDING)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      shardKey: undefined,
      loadingError: undefined,
      shardingError: action.error,
      isReady: true,
    };
  }

  if (
    isAction<NamespaceShardKeyFetchedAction>(
      action,
      GlobalWritesActionTypes.NamespaceShardKeyFetched
    ) &&
    (status === ShardingStatuses.NOT_READY ||
      status === ShardingStatuses.SHARDING)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      shardKey: action.shardKey,
      shardingError: undefined,
      isReady: true,
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
    (status === ShardingStatuses.UNSHARDED ||
      status === ShardingStatuses.SHARDING_ERROR ||
      status === ShardingStatuses.INCOMPLETE_SHARDING_SETUP)
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
    (status === ShardingStatuses.UNSHARDED ||
      status === ShardingStatuses.SHARDING_ERROR ||
      status === ShardingStatuses.INCOMPLETE_SHARDING_SETUP ||
      status === ShardingStatuses.NOT_READY)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      shardingError: undefined,
      managedNamespace: action.managedNamespace || state.managedNamespace,
    };
  }

  if (
    isAction<CancellingShardingStartedAction>(
      action,
      GlobalWritesActionTypes.CancellingShardingStarted
    ) &&
    (status === ShardingStatuses.SHARDING ||
      status === ShardingStatuses.SHARDING_ERROR ||
      status === ShardingStatuses.INCOMPLETE_SHARDING_SETUP)
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
    (status === ShardingStatuses.SHARDING ||
      status === ShardingStatuses.SHARDING_ERROR ||
      status === ShardingStatuses.INCOMPLETE_SHARDING_SETUP)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      managedNamespace: undefined,
    };
  }

  if (
    isAction<UnmanagingNamespaceStartedAction>(
      action,
      GlobalWritesActionTypes.UnmanagingNamespaceStarted
    ) &&
    state.shardKey
  ) {
    return {
      ...state,
      shardKey: state.shardKey,
      shardingError: undefined,
      loadingError: undefined,
      userActionInProgress: 'unmanageNamespace',
    };
  }

  if (
    isAction<UnmanagingNamespaceFinishedAction>(
      action,
      GlobalWritesActionTypes.UnmanagingNamespaceFinished
    ) &&
    (status === ShardingStatuses.SHARD_KEY_CORRECT ||
      status === ShardingStatuses.SHARD_KEY_MISMATCH)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      managedNamespace: undefined,
    };
  }

  if (
    isAction<LoadingFailedAction>(
      action,
      GlobalWritesActionTypes.LoadingFailed
    ) &&
    (status === ShardingStatuses.NOT_READY ||
      status === ShardingStatuses.SHARDING)
  ) {
    return {
      ...state,
      userActionInProgress: undefined,
      loadingError: action.error,
      isReady: true,
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
      dispatch(setNamespaceBeingManaged(managedNamespace));
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

    const state = getState();
    const { namespace, userActionInProgress } = state;
    const status = getStatus(state);

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

const setNamespaceBeingManaged = (
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
    const status = getStatus(getState());
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

      if (shardingError && !shardKey) {
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

      if (managedNamespace && !shardKey && !shardingError) {
        // Since the namespace is managed, Atlas has been instructed to shard this collection,
        // and since there is no shard key and no sharding error, the sharding must still be in progress
        dispatch(setNamespaceBeingManaged());
        return;
      }

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
  managedNamespace: ManagedNamespace
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
