import { combineReducers } from 'redux';
import dataService from '../data-service';
import serverVersion from '../server-version';
import isRunning, {
  toggleIsRunning,
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE
} from '../is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE
} from '../is-visible';
import databaseName, {
  INITIAL_STATE as DATABASE_NAME_INITIAL_STATE
} from '../database-name';
import error, {
  clearError, handleError, INITIAL_STATE as ERROR_INITIAL_STATE
} from '../error';
import { reset, RESET } from '../reset';
import { prepareMetrics } from '../metrics';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import queryParser from 'mongodb-query-parser';

const { debug, track } = createLoggerAndTelemetry('COMPASS-COLLECTIONS-UI');

/**
 * Open action name.
 */
const OPEN = 'databases-collections/create-collection/OPEN';

/**
 * No dots in DB name error message.
 */
export const NO_DOT = 'Database names may not contain a "."';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isRunning,
  isVisible,
  databaseName,
  error,
  serverVersion,
  dataService
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state, action) => {
  const resetState = {
    ...state,
    isRunning: IS_RUNNING_INITIAL_STATE,
    isVisible: IS_VISIBLE_INITIAL_STATE,
    databaseName: DATABASE_NAME_INITIAL_STATE,
    error: ERROR_INITIAL_STATE
  };

  if (action.type === RESET) {
    return resetState;
  } else if (action.type === OPEN) {
    return {
      ...resetState,
      isVisible: true,
      databaseName: action.databaseName
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * Stop progress and set the error.
 *
 * @param {Function} dispatch - The dispatch function.
 * @param {Error} err - The error.
 *
 * @return {Object} The result.
 */
const stopWithError = (dispatch, err) => {
  debug('create collection failed', err);
  dispatch(toggleIsRunning(false));
  return dispatch(handleError(err));
};

/**
 * Open create collection action creator.
 *
 * @param {String} dbName - The database name.
 *
 * @returns {Object} The action.
 */
export const open = (dbName) => ({
  type: OPEN,
  databaseName: dbName
});

export const createCollection = (data, kind = 'Collection') => {
  // Note: This method can also be called from createDatabase(),
  // against a different state.
  return async(dispatch, getState) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const dbName = kind === 'Collection' ? state.databaseName : data.database;
    const collName = data.collection;
    const namespace = `${dbName}.${collName}`;

    dispatch(clearError());

    if (dbName && dbName.includes('.')) {
      return dispatch(handleError(new Error(NO_DOT)));
    }

    try {
      dispatch(toggleIsRunning(true));

      const options = await handleFLE2Options(ds, data.options);

      const collection = await new Promise((resolve, reject) => {
        ds.createCollection(namespace, options, (err, coll) => {
          if (err) reject(err); else resolve(coll);
        });
      });

      const trackEvent = {
        is_capped: !!data.options.capped,
        has_collation: !!data.options.collation,
        is_timeseries: !!data.options.timeseries,
        is_clustered: !!data.options.clusteredIndex,
        is_fle2: !!data.options.encryptedFields,
        expires: !!data.options.expireAfterSeconds
      };

      track(`${kind} Created`, trackEvent);

      prepareMetrics(collection).then((metrics) => {
        global.hadronApp.appRegistry.emit('compass:collection:created', metrics);
      });
      global.hadronApp.appRegistry.emit('collection-created', {
        ns: namespace,
        database: dbName,
        collection: collName,
      });
      dispatch(reset());
    } catch (e) {
      return stopWithError(dispatch, e);
    }
  };
};

export async function handleFLE2Options(ds, options) {
  if (!options) {
    return options;
  }

  if (options.encryptedFields) {
    try {
      options.encryptedFields = queryParser(options.encryptedFields);
    } catch (err) {
      throw new Error(`Could not parse encryptedFields config: ${err.message}`);
    }

    if (Object.keys(options.encryptedFields).length === 0) {
      delete options.encryptedFields;
    } else if (options.kmsProvider) {
      // If keys are missing from the encryptedFields config,
      // generate them as part of the collection creation operation.
      let keyEncryptionKey;
      try {
        keyEncryptionKey = queryParser(options.keyEncryptionKey || '{}');
      } catch (err) {
        throw new Error(`Could not parse keyEncryptionKey: ${err.message}`);
      }

      const fields = options.encryptedFields.fields;
      if (Array.isArray(fields)) {
        const keyCreationPromises = [];
        for (const field of fields) {
          if (field.keyId) continue;
          keyCreationPromises.push((async() => {
            field.keyId = await ds.createDataKey(options.kmsProvider, {
              masterKey: keyEncryptionKey
            });
          })());
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
