import type { Reducer } from 'redux';
import type Collection from 'mongodb-collection-model';

export type CollectionStats = Pick<
  Collection,
  | 'document_count'
  | 'index_count'
  | 'index_size'
  | 'status'
  | 'avg_document_size'
  | 'storage_size'
  | 'free_storage_size'
>;
export type CollectionStatsState = CollectionStats | null;

export const INITIAL_STATE: CollectionStatsState = null;

export function pickCollectionStats(collection: Collection): CollectionStats {
  const {
    document_count,
    index_count,
    index_size,
    status,
    avg_document_size,
    storage_size,
    free_storage_size,
  } = collection.toJSON();
  return {
    document_count,
    index_count,
    index_size,
    status,
    avg_document_size,
    storage_size,
    free_storage_size,
  };
}

enum CollectionStatsActions {
  CollectionStatsFetched = 'compass-aggregations/collection-stats/CollectionStatsFetched',
}

const reducer: Reducer<CollectionStatsState> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === CollectionStatsActions.CollectionStatsFetched) {
    return {
      ...pickCollectionStats(action.collection),
    };
  }
  return state;
};

export const collectionStatsFetched = (collection: Collection) => {
  return { type: CollectionStatsActions.CollectionStatsFetched, collection };
};

export default reducer;
