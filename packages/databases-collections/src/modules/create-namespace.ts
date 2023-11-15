import type { Reducer } from 'redux';
import { parseFilter } from 'mongodb-query-parser';
import type { DataService } from 'mongodb-data-service';
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

export const RESET = 'databases-collections/reset';

export const reset = () => ({
  type: RESET,
});

const OPEN = 'databases-collections/create-collection/OPEN';

export const open = (
  dbName: string | null = null
): CreateNamespaceThunkAction<void> => {
  return (dispatch, _getState, { logger: { track } }) => {
    track('Screen', {
      name: dbName ? 'create_collection_modal' : 'create_database_modal',
    });

    dispatch({
      type: OPEN,
      databaseName: dbName,
    });
  };
};

export const HANDLE_ERROR = `databases-collections/error/HANDLE_ERROR`;

export const handleError = (error: Error) => ({
  type: HANDLE_ERROR,
  error: error,
});

export const CLEAR_ERROR = `databases-collections/error/CLEAR_ERROR`;

export const clearError = () => ({
  type: CLEAR_ERROR,
});

export const TOGGLE_IS_RUNNING =
  'databases-collections/is-running/TOGGLE_IS_RUNNING';

export const toggleIsRunning = (isRunning: boolean) => ({
  type: TOGGLE_IS_RUNNING,
  isRunning: isRunning,
});

export const TOGGLE_IS_VISIBLE = `databases-collections/is-visible/TOGGLE_IS_VISIBLE`;

export const toggleIsVisible = (isVisible: boolean) => ({
  type: TOGGLE_IS_VISIBLE,
  isVisible: isVisible,
});

export const TOPOLOGY_CHANGED = `databases-collections/TOPOLOGY_CHANGED`;

export const topologyChanged = (newTopology: string) => ({
  type: TOPOLOGY_CHANGED,
  newTopology: newTopology,
});

const reducer: Reducer<CreateNamespaceState> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === RESET) {
    return { ...INITIAL_STATE, serverVersion: state.serverVersion };
  }
  if (action.type === OPEN) {
    return {
      ...state,
      databaseName: action.databaseName,
      // Reset form related state on open
      isRunning: false,
      isVisible: true,
      error: null,
    };
  }
  if (action.type === HANDLE_ERROR) {
    return {
      ...state,
      error: action.error,
    };
  }
  if (action.type === CLEAR_ERROR) {
    return {
      ...state,
      error: null,
    };
  }
  if (action.type === TOGGLE_IS_VISIBLE) {
    return {
      ...state,
      isVisible: action.isVisible,
    };
  }
  if (action.type === TOPOLOGY_CHANGED) {
    return {
      ...state,
      currentTopologyType: action.newTopology,
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
    { dataService: ds, globalAppRegistry, logger: { track, debug } }
  ) => {
    const { databaseName } = getState();
    const kind = databaseName !== null ? 'Collection' : 'Database';
    const dbName = databaseName ?? data.database;
    const collName = data.collection;
    const namespace = `${dbName}.${collName}`;

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

      globalAppRegistry.emit('collection-created', {
        ns: namespace,
        database: dbName,
        collection: collName,
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
