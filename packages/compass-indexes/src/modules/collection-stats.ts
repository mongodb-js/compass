import type { Reducer, Action } from 'redux';
import type Collection from 'mongodb-collection-model';
import { isAction } from '@mongodb-js/compass-utils';

export function extractCollectionStats(
  collection: Collection
): CollectionStats {
  const { index_count, index_size } = collection.toJSON();
  return {
    index_count,
    index_size,
  };
}

export type CollectionStats = Pick<
  Collection,
  'index_count' | 'index_size'
> | null;

enum StatsActions {
  CollectionStatsFetched = 'compass-indexes/CollectionStatsFetchedCollection',
}

interface CollectionStatsFetchedAction {
  type: StatsActions.CollectionStatsFetched;
  collection: Collection;
}

const reducer: Reducer<CollectionStats, Action> = (state = null, action) => {
  if (
    isAction<CollectionStatsFetchedAction>(
      action,
      StatsActions.CollectionStatsFetched
    )
  ) {
    return extractCollectionStats(action.collection);
  }
  return state;
};

export const collectionStatsFetched = (
  collection: Collection
): CollectionStatsFetchedAction => {
  return { type: StatsActions.CollectionStatsFetched, collection };
};

export default reducer;
