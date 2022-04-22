import type { AnyAction } from 'redux';
import type Collection from 'mongodb-collection-model';
import numeral from 'numeral';

/**
 * The prefix.
 */
const PREFIX = 'collection';

/**
 * Collection details updated action name.
 */
export const UPDATE_COLLECTION_DETAILS = `${PREFIX}/stats/UPDATE_COLLECTION_DETAILS`;

/**
 * Collection details reset action name.
 */
export const RESET_COLLECTION_DETAILS = `${PREFIX}/stats/RESET_COLLECTION_DETAILS`;

/**
 * Invalid stats.
 */
const INVALID = 'N/A';

export interface CollectionStatsObject {
  documentCount: string;
  storageSize: string;
  avgDocumentSize: string;
  indexCount: string;
  totalIndexSize: string;
  avgIndexSize: string;
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

export const getInitialState = (): CollectionStatsObject => ({
  documentCount: INVALID,
  storageSize: INVALID,
  avgDocumentSize: INVALID,
  indexCount: INVALID,
  totalIndexSize: INVALID,
  avgIndexSize: INVALID,
});

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
  collectionModel: Collection
): {
  type: string;
  stats: CollectionStatsObject;
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
  let stats = getInitialState();

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
const reducer = (
  state = getInitialState(),
  action: AnyAction
): CollectionStatsObject => {
  if (action.type === UPDATE_COLLECTION_DETAILS) {
    return action.stats;
  } else if (action.type === RESET_COLLECTION_DETAILS) {
    return getInitialState();
  }
  return state;
};

export default reducer;
