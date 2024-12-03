import type { Action, AnyAction, Reducer } from 'redux';
import { parseFilter } from 'mongodb-query-parser';
import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { CreateNamespaceThunkAction } from '../stores/create-namespace';
import { connectionSupports } from '@mongodb-js/compass-connections';
import toNS from 'mongodb-ns';

/**
 * No dots in DB name error message.
 */
export const NO_DOT = 'Database names may not contain a "."';

type CreateNamespaceState = {
  isRunning: boolean;
  isVisible: boolean;
  databaseName: string | null;
  error: Error | null;
  // The connection id for which the modal was opened
  connectionId: string;
  connectionMetaData: {
    [connectionId: string]: {
      serverVersion: string;
      currentTopologyType: string;
      configuredKMSProviders: ReturnType<DataService['configuredKMSProviders']>;
    };
  };
};

export const INITIAL_STATE: CreateNamespaceState = {
  isRunning: false,
  isVisible: false,
  databaseName: null,
  error: null,
  connectionId: '',
  connectionMetaData: {},
};

export const enum CreateNamespaceActionTypes {
  Reset = 'databases-collections/Reset',
  Open = 'databases-collections/create-collection/Open',
  Close = 'databases-collections/create-collection/Close',
  HandleError = 'databases-collections/error/HandleError',
  ClearError = 'databases-collections/error/ClearError',
  ToggleIsRunning = 'databases-collections/is-running/ToggleIsRunning',
  TopologyChanged = 'databases-collections/TopologyChanged',
  ServerVersionRetrieved = 'databases-collections/ServerVersionRetrieved',
  KMSProvidersRetrieved = 'databases-collections/KMSProvidersRetrieved',
}

export type ResetAction = {
  type: CreateNamespaceActionTypes.Reset;
};

export type OpenAction = {
  type: CreateNamespaceActionTypes.Open;
  connectionId: string;
  databaseName: string | null;
};

export type CloseAction = {
  type: CreateNamespaceActionTypes.Close;
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

export type TopologyChangedAction = {
  type: CreateNamespaceActionTypes.TopologyChanged;
  connectionId: string;
  newTopology: string;
};

export type ServerVersionRetrievedAction = {
  type: CreateNamespaceActionTypes.ServerVersionRetrieved;
  connectionId: string;
  version: string;
};

export type KMSProvidersRetrievedAction = {
  type: CreateNamespaceActionTypes.KMSProvidersRetrieved;
  connectionId: string;
  configuredKMSProviders: ReturnType<DataService['configuredKMSProviders']>;
};

export const reset = (): ResetAction => ({
  type: CreateNamespaceActionTypes.Reset,
});

export const open = (
  connectionId: string,
  dbName: string | null = null
): CreateNamespaceThunkAction<void, OpenAction> => {
  return (dispatch, _getState, { track }) => {
    track(
      'Screen',
      {
        name: dbName ? 'create_collection_modal' : 'create_database_modal',
      },
      undefined
    );

    dispatch({
      type: CreateNamespaceActionTypes.Open,
      connectionId,
      databaseName: dbName,
    });
  };
};

export const close = (): CloseAction => ({
  type: CreateNamespaceActionTypes.Close,
});

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

export const topologyChanged = (
  connectionId: string,
  newTopology: string
): TopologyChangedAction => ({
  type: CreateNamespaceActionTypes.TopologyChanged,
  connectionId,
  newTopology,
});

export const serverVersionRetrieved = (
  connectionId: string,
  version: string
): ServerVersionRetrievedAction => ({
  type: CreateNamespaceActionTypes.ServerVersionRetrieved,
  connectionId,
  version,
});

export const kmsProvidersRetrieved = (
  connectionId: string,
  configuredKMSProviders: ReturnType<DataService['configuredKMSProviders']>
): KMSProvidersRetrievedAction => ({
  type: CreateNamespaceActionTypes.KMSProvidersRetrieved,
  connectionId,
  configuredKMSProviders,
});

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

const reducer: Reducer<CreateNamespaceState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<ResetAction>(action, CreateNamespaceActionTypes.Reset)) {
    return { ...INITIAL_STATE };
  }

  if (isAction<CloseAction>(action, CreateNamespaceActionTypes.Close)) {
    // When a modal is closed, we should not clear the connectionMetaData
    return {
      ...INITIAL_STATE,
      connectionMetaData: state.connectionMetaData,
    };
  }

  if (isAction<OpenAction>(action, CreateNamespaceActionTypes.Open)) {
    return {
      ...state,
      connectionId: action.connectionId,
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
    isAction<ToggleIsRunningAction>(
      action,
      CreateNamespaceActionTypes.ToggleIsRunning
    )
  ) {
    return {
      ...state,
      isRunning: action.isRunning,
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
      connectionMetaData: {
        ...state.connectionMetaData,
        [action.connectionId]: {
          ...state.connectionMetaData[action.connectionId],
          currentTopologyType: action.newTopology,
        },
      },
    };
  }

  if (
    isAction<ServerVersionRetrievedAction>(
      action,
      CreateNamespaceActionTypes.ServerVersionRetrieved
    )
  ) {
    return {
      ...state,
      connectionMetaData: {
        ...state.connectionMetaData,
        [action.connectionId]: {
          ...state.connectionMetaData[action.connectionId],
          serverVersion: action.version,
        },
      },
    };
  }

  if (
    isAction<KMSProvidersRetrievedAction>(
      action,
      CreateNamespaceActionTypes.KMSProvidersRetrieved
    )
  ) {
    return {
      ...state,
      connectionMetaData: {
        ...state.connectionMetaData,
        [action.connectionId]: {
          ...state.connectionMetaData[action.connectionId],
          configuredKMSProviders: action.configuredKMSProviders,
        },
      },
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
    { globalAppRegistry, connections, logger: { debug }, track, workspaces }
  ) => {
    const { databaseName, connectionId } = getState();
    const kind = databaseName !== null ? 'Collection' : 'Database';

    const dbName = databaseName ?? data.database?.trim();
    const collName = data.collection.trim();
    const namespace = `${dbName}.${collName}`;

    dispatch(clearError());

    if (dbName && dbName.includes('.')) {
      dispatch(handleError(new Error(NO_DOT)));
    }

    try {
      dispatch(toggleIsRunning(true));
      const ds = connections.getDataServiceForConnection(connectionId);

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

      const connectionInfo = connections.getConnectionById(connectionId)?.info;

      track(`${kind} Created`, trackEvent, connectionInfo);

      globalAppRegistry.emit('collection-created', namespace, {
        connectionId,
      });

      // For special namespaces (admin, local, config), we do not want
      // to navigate user to the global-writes tab if it's supported.
      const isSpecialNS = toNS(namespace).isSpecial;
      const isGlobalWritesSupported =
        connectionInfo && connectionSupports(connectionInfo, 'globalWrites');
      workspaces.openCollectionWorkspace(connectionId, namespace, {
        newTab: true,
        initialSubtab:
          !isSpecialNS && isGlobalWritesSupported ? 'GlobalWrites' : undefined,
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
