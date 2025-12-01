import type { Action, Reducer } from 'redux';
import type Collection from 'mongodb-collection-model';
import { isAction } from '../utils/is-action';

export type CollectionStats = {
  document_count?: number;
  pipeline?: unknown[];
};

export const INITIAL_STATE: CollectionStats = {
  document_count: undefined,
  pipeline: undefined,
};

export function pickCollectionStats(collection: Collection): CollectionStats {
  const { document_count, pipeline } = collection.toJSON();
  return {
    document_count,
    pipeline,
  };
}

// @ts-expect-error TODO(COMPASS-10124): replace enums with const kv objects
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
