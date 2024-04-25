import type { AnyAction, Reducer } from 'redux';
import { parseFilter } from 'mongodb-query-parser';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { CreateNamespaceThunkAction } from '../stores/create-namespace';

/**
 * No dots in DB name error message.
 */
export const NO_DOT = 'Database names may not contain a "."';

type CreateNamespaceState = {
  isRunning: boolean;
  isVisible: boolean;
  databaseName: string | null;
  error: Error | null;
  serverVersion: string;
  currentTopologyType: string;
  configuredKMSProviders: ReturnType<DataService['configuredKMSProviders']>;
};

export const INITIAL_STATE = {
  isRunning: false,
  isVisible: false,
  databaseName: null,
  error: null,
  serverVersion: '0.0.0',
  configuredKMSProviders: [],
  currentTopologyType: 'Unknown' as const,
};

export const enum CreateNamespaceActionTypes {
  Reset = 'databases-collections/Reset',
  Open = 'databases-collections/create-collection/Open',
  HandleError = 'databases-collections/error/HandleError',
  ClearError = 'databases-collections/error/ClearError',
  ToggleIsRunning = 'databases-collections/is-running/ToggleIsRunning',
  ToggleIsVisible = 'databases-collections/is-visible/ToggleIsVisible',
  TopologyChanged = 'databases-collections/TopologyChanged',
  InstanceProvided = 'databases-collections/InstanceProvided',
  DataServiceProvided = 'databases-collections/DataServiceProvided',
}

export type ResetAction = {
  type: CreateNamespaceActionTypes.Reset;
};

export type OpenAction = {
  type: CreateNamespaceActionTypes.Open;
  databaseName: string | null;
};

export type HandleErrorAction = {
  type: CreateNamespaceActionTypes.HandleError;
  error: Error;
};

export type ClearErrorAction = {
  type: CreateNamespaceActionTypes.ClearError;
};

export type ToggleIsRunningAction = {
  type: CreateNamespaceActionTypes.ToggleIsRunning;
  isRunning: boolean;
};

export type ToggleIsVisibleAction = {
  type: CreateNamespaceActionTypes.ToggleIsVisible;
  isVisible: boolean;
};

export type TopologyChangedAction = {
  type: CreateNamespaceActionTypes.TopologyChanged;
  newTopology: string;
};

export type InstanceProvidedAction = {
  type: CreateNamespaceActionTypes.InstanceProvided;
  topology: string;
  serverVersion: string;
};

export type DataServiceProvidedAction = {
  type: CreateNamespaceActionTypes.DataServiceProvided;
  configuredKMSProviders: ReturnType<DataService['configuredKMSProviders']>;
};

export const reset = (): ResetAction => ({
  type: CreateNamespaceActionTypes.Reset,
});

export const open = (
  dbName: string | null = null
): CreateNamespaceThunkAction<void, OpenAction> => {
  return (dispatch, _getState, { logger: { track } }) => {
    track('Screen', {
      name: dbName ? 'create_collection_modal' : 'create_database_modal',
    });

    dispatch({
      type: CreateNamespaceActionTypes.Open,
      databaseName: dbName,
    });
  };
};

export const handleError = (error: Error): HandleErrorAction => ({
  type: CreateNamespaceActionTypes.HandleError,
  error: error,
});

export const clearError = (): ClearErrorAction => ({
  type: CreateNamespaceActionTypes.ClearError,
});

export const toggleIsRunning = (isRunning: boolean): ToggleIsRunningAction => ({
  type: CreateNamespaceActionTypes.ToggleIsRunning,
  isRunning: isRunning,
});

export const toggleIsVisible = (isVisible: boolean): ToggleIsVisibleAction => ({
  type: CreateNamespaceActionTypes.ToggleIsVisible,
  isVisible: isVisible,
});

export const topologyChanged = (
  newTopology: string
): TopologyChangedAction => ({
  type: CreateNamespaceActionTypes.TopologyChanged,
  newTopology: newTopology,
});

export const instanceProvided = (params: {
  serverVersion: string;
  topology: string;
}): InstanceProvidedAction => ({
  type: CreateNamespaceActionTypes.InstanceProvided,
  ...params,
});

export const dataServiceProvided = (params: {
  configuredKMSProviders: ReturnType<DataService['configuredKMSProviders']>;
}): DataServiceProvidedAction => ({
  type: CreateNamespaceActionTypes.DataServiceProvided,
  ...params,
});

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

const reducer: Reducer<CreateNamespaceState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<ResetAction>(action, CreateNamespaceActionTypes.Reset)) {
    return { ...INITIAL_STATE, serverVersion: state.serverVersion };
  }

  if (isAction<OpenAction>(action, CreateNamespaceActionTypes.Open)) {
    return {
      ...state,
      databaseName: action.databaseName,
      // Reset form related state on open
      isRunning: false,
      isVisible: true,
      error: null,
    };
  }

  if (
    isAction<HandleErrorAction>(action, CreateNamespaceActionTypes.HandleError)
  ) {
    return {
      ...state,
      error: action.error,
    };
  }

  if (
    isAction<ClearErrorAction>(action, CreateNamespaceActionTypes.ClearError)
  ) {
    return {
      ...state,
      error: null,
    };
  }

  if (
    isAction<ToggleIsVisibleAction>(
      action,
      CreateNamespaceActionTypes.ToggleIsVisible
    )
  ) {
    return {
      ...state,
      isVisible: action.isVisible,
    };
  }

  if (
    isAction<TopologyChangedAction>(
      action,
      CreateNamespaceActionTypes.TopologyChanged
    )
  ) {
    return {
      ...state,
      currentTopologyType: action.newTopology,
    };
  }

  if (
    isAction<InstanceProvidedAction>(
      action,
      CreateNamespaceActionTypes.InstanceProvided
    )
  ) {
    return {
      ...state,
      serverVersion: action.serverVersion,
      currentTopologyType: action.topology,
    };
  }

  if (
    isAction<DataServiceProvidedAction>(
      action,
      CreateNamespaceActionTypes.DataServiceProvided
    )
  ) {
    return {
      ...state,
      configuredKMSProviders: action.configuredKMSProviders,
    };
  }
  return state;
};

export type CreateNamespaceOptions = {
  database?: string;
  collection: string;
  options: {
    capped?: boolean;
    size?: number;
    collation?: Record<string, unknown>;
    timeseries?: Record<string, unknown>;
    expireAfterSeconds?: number;
    clusteredIndex?: Record<string, unknown>;
    encryptedFields?: string;
    keyEncryptionKey?: string;
    kmsProvider?: string;
  };
};

export async function handleFLE2Options(
  ds: Pick<DataService, 'createDataKey'>,
  options?: CreateNamespaceOptions['options']
) {
  if (!options) {
    return options;
  }

  options = { ...options };

  if (options.encryptedFields) {
    try {
      options.encryptedFields = parseFilter(options.encryptedFields);
    } catch (err) {
      throw new Error(
        `Could not parse encryptedFields config: ${(err as Error).message}`
      );
    }

    if (Object.keys(options.encryptedFields as any).length === 0) {
      delete options.encryptedFields;
    } else if (options.kmsProvider) {
      // If keys are missing from the encryptedFields config,
      // generate them as part of the collection creation operation.
      let keyEncryptionKey;
      try {
        keyEncryptionKey = parseFilter(options.keyEncryptionKey || '{}');
      } catch (err) {
        throw new Error(
          `Could not parse keyEncryptionKey: ${(err as Error).message}`
        );
      }

      const fields = (options.encryptedFields as any)?.fields;
      if (Array.isArray(fields)) {
        const keyCreationPromises = [];
        for (const field of fields) {
          if (field.keyId) continue;
          keyCreationPromises.push(
            (async () => {
              field.keyId = await ds.createDataKey(options.kmsProvider!, {
                masterKey: keyEncryptionKey,
              });
            })()
          );
        }
        await Promise.all(keyCreationPromises);
      }
    }
  } else {
    delete options.encryptedFields;
  }

  delete options.kmsProvider;
  delete options.keyEncryptionKey;

  return options;
}

export const createNamespace = (
  data: CreateNamespaceOptions
): CreateNamespaceThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    {
      dataService: ds,
      globalAppRegistry,
      logger: { track, debug },
      workspaces,
      connectionInfoAccess,
    }
  ) => {
    const { databaseName } = getState();
    const kind = databaseName !== null ? 'Collection' : 'Database';
    const dbName = databaseName ?? data.database;
    const collName = data.collection;
    const namespace = `${dbName}.${collName}`;
    const { id: connectionId } =
      connectionInfoAccess.getCurrentConnectionInfo();

    dispatch(clearError());

    if (dbName && dbName.includes('.')) {
      dispatch(handleError(new Error(NO_DOT)));
    }

    try {
      dispatch(toggleIsRunning(true));

      const options = await handleFLE2Options(ds, data.options);

      await ds.createCollection(namespace, (options as any) ?? {});

      const trackEvent = {
        is_capped: !!data.options.capped,
        has_collation: !!data.options.collation,
        is_timeseries: !!data.options.timeseries,
        is_clustered: !!data.options.clusteredIndex,
        is_fle2: !!data.options.encryptedFields,
        expires: !!data.options.expireAfterSeconds,
      };

      track(`${kind} Created`, trackEvent);

      globalAppRegistry.emit('collection-created', namespace);
      workspaces.openCollectionWorkspace(connectionId, namespace, {
        newTab: true,
      });
      dispatch(reset());
    } catch (e) {
      debug('create collection failed', e);
      dispatch(toggleIsRunning(false));
      dispatch(handleError(e as Error));
    }
  };
};

export default reducer;
