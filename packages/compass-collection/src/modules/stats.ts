import type { AnyAction } from 'redux';
import numeral from 'numeral';

/**
 * The prefix.
 */
const PREFIX = 'collection';

/**
 * Collection details updated action name.
 */
export const UPDATE_COLLECTION_DETAILS = `${PREFIX}/tabs/UPDATE_COLLECTION_DETAILS`;

/**
 * Collection details reset action name.
 */
export const RESET_COLLECTION_DETAILS = `${PREFIX}/tabs/RESET_COLLECTION_DETAILS`;

/**
 * Invalid stats.
 */
const INVALID = 'N/A';

export interface StatsObject {
  documentCount: number | string;
  storageSize: number | string;
  avgDocumentSize: number | string;
  indexCount: number | string;
  totalIndexSize: number | string;
  avgIndexSize: number | string;
}

const avg = (size: number, count: number) => {
  if (count <= 0) {
    return 0;
  }
  return size / count;
};

const isNumber = (val: any) => {
  return typeof val === 'number' && !isNaN(val);
};

const format = (value: any, format = 'a') => {
  if (!isNumber(value)) {
    return INVALID;
  }
  const precision = value <= 1000 ? '0' : '0.0';
  return numeral(value).format(precision + format);
};

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  documentCount: INVALID,
  storageSize: INVALID,
  avgDocumentSize: INVALID,
  indexCount: INVALID,
  totalIndexSize: INVALID,
  avgIndexSize: INVALID,
};

export const resetCollectionDetails = (): { type: string } => {
  return {
    type: RESET_COLLECTION_DETAILS,
  };
};

/**
 * Action creator for clearing tabs.
 *
 * @returns {Object} The action.
 */
export const updateCollectionDetails = (
  collectionModel: any
): {
  type: string;
  stats: StatsObject;
} => {
  const {
    document_count,
    index_count,
    index_size,
    status,
    avg_document_size,
    storage_size,
    free_storage_size,
  } = collectionModel;
  let stats = INITIAL_STATE;

  if (!['initial', 'fetching', 'error'].includes(status)) {
    stats = {
      documentCount: format(document_count),
      storageSize: format(storage_size - free_storage_size, 'b'),
      avgDocumentSize: format(avg_document_size, 'b'),
      indexCount: format(index_count),
      totalIndexSize: format(index_size, 'b'),
      avgIndexSize: format(avg(index_size, index_count), 'b'),
    };
  }

  return {
    type: UPDATE_COLLECTION_DETAILS,
    stats,
  };
};

/**
 * Reducer function for handle state changes to stats.
 *
 * @param {Object} state - The input documents state.
 * @param {Object} action - The action.
 *
 * @returns {any} The new state.
 */
const reducer = (state = INITIAL_STATE, action: AnyAction): StatsObject => {
  if (action.type === UPDATE_COLLECTION_DETAILS) {
    return action.stats;
  } else if (action.type === RESET_COLLECTION_DETAILS) {
    return INITIAL_STATE;
  }
  return state;
};

export default reducer;
