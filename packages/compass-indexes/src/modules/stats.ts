import type { Reducer, AnyAction, Action } from 'redux';
import type Collection from 'mongodb-collection-model';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export function pickCollectionIndexStats(collection: Collection): StatsState {
  const { index_count, index_size } = collection.toJSON();
  return {
    index_count,
    index_size,
  };
}

export type StatsState = Pick<Collection, 'index_count' | 'index_size'> | null;

enum StatsActions {
  CollectionStatsFetched = 'compass-indexes/CollectionStatsFetched',
}

interface CollectionStatsFetchedAction {
  type: StatsActions.CollectionStatsFetched;
  collection: Collection;
}

const reducer: Reducer<StatsState, Action> = (state = null, action) => {
  if (
    isAction<CollectionStatsFetchedAction>(
      action,
      StatsActions.CollectionStatsFetched
    )
  ) {
    return pickCollectionIndexStats(action.collection);
  }
  return state;
};

export const collectionStatsFetched = (
  collection: Collection
): CollectionStatsFetchedAction => {
  return { type: StatsActions.CollectionStatsFetched, collection };
};

export default reducer;
