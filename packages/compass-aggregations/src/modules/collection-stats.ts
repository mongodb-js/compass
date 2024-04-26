import type { Reducer } from 'redux';
import type Collection from 'mongodb-collection-model';

export type CollectionStats = {
  document_count?: number;
};

export const INITIAL_STATE: CollectionStats = {
  document_count: undefined,
};

export function pickCollectionStats(collection: Collection): CollectionStats {
  const { document_count } = collection.toJSON();
  return {
    document_count,
  };
}

enum CollectionStatsActions {
  CollectionStatsFetched = 'compass-aggregations/collection-stats/CollectionStatsFetched',
}

const reducer: Reducer<CollectionStats> = (state = INITIAL_STATE, action) => {
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
