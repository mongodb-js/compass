import type { Action, Reducer } from 'redux';
import type Collection from 'mongodb-collection-model';
import { isAction } from '../utils/is-action';

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

interface CollectionStatsFetchedAction {
  type: CollectionStatsActions.CollectionStatsFetched;
  collection: Collection;
}

const reducer: Reducer<CollectionStats, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<CollectionStatsFetchedAction>(
      action,
      CollectionStatsActions.CollectionStatsFetched
    )
  ) {
    return {
      ...pickCollectionStats(action.collection),
    };
  }
  return state;
};

export const collectionStatsFetched = (
  collection: Collection
): CollectionStatsFetchedAction => {
  return { type: CollectionStatsActions.CollectionStatsFetched, collection };
};

export default reducer;
