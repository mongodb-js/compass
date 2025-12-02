import type { Reducer, AnyAction, Action } from 'redux';
import type Collection from 'mongodb-collection-model';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export function extractCollectionStats(
  collection: Collection
): CollectionStats {
  const { index_count, index_size, pipeline } = collection.toJSON();
  return {
    index_count,
    index_size,
    pipeline,
  };
}

export type CollectionStats = Pick<
  Collection,
  'index_count' | 'index_size' | 'pipeline'
> | null;

const StatsActions = {
  CollectionStatsFetched: 'compass-indexes/CollectionStatsFetchedCollection',
} as const;

interface CollectionStatsFetchedAction {
  type: typeof StatsActions.CollectionStatsFetched;
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
