import type { AnyAction } from 'redux';
import type Collection from 'mongodb-collection-model';
import numeral from 'numeral';
import { omit } from 'lodash';

export enum ActionTypes {
  UpdateCollectionDetails = 'collection/stats/UPDATE_COLLECTION_DETAILS',
  ResetCollectionDetails = 'collection/stats/RESET_COLLECTION_DETAILS',
}

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

export type CollectionStatsMap = {
  [namespace: string]: CollectionStatsObject;
};

type UpdateCollectionDetailsAction = {
  type: ActionTypes.UpdateCollectionDetails;
  namespace: string;
  stats: CollectionStatsObject;
};

type ResetCollectionDetailsAction = {
  type: ActionTypes.ResetCollectionDetails;
  namespace: string;
};

export type Actions =
  | UpdateCollectionDetailsAction
  | ResetCollectionDetailsAction;

type State = CollectionStatsMap;

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

export const getCollectionStatsInitialState = (): CollectionStatsObject => ({
  documentCount: INVALID,
  storageSize: INVALID,
  avgDocumentSize: INVALID,
  indexCount: INVALID,
  totalIndexSize: INVALID,
  avgIndexSize: INVALID,
});

export const getInitialState = (): State => ({});

export const resetCollectionDetails = (
  namespace: string
): ResetCollectionDetailsAction => ({
  type: ActionTypes.ResetCollectionDetails,
  namespace,
});

/**
 * Action creator for clearing tabs.
 *
 * @returns {Object} The action.
 */
export const updateCollectionDetails = (
  collectionModel: Collection,
  namespace: string
): UpdateCollectionDetailsAction => {
  const {
    document_count,
    index_count,
    index_size,
    status,
    avg_document_size,
    storage_size,
    free_storage_size,
  } = collectionModel;
  let stats = getCollectionStatsInitialState();

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
    type: ActionTypes.UpdateCollectionDetails,
    namespace,
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
const reducer = (state = getInitialState(), action: AnyAction): State => {
  switch (action.type) {
    case ActionTypes.UpdateCollectionDetails:
      return {
        ...state,
        [action.namespace]: action.stats,
      };
    case ActionTypes.ResetCollectionDetails:
      return omit(state, action.namespace);
    default:
      return state;
  }
};

export default reducer;
