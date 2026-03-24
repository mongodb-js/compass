import type { Store } from 'redux';
import type { RootState } from './query-bar-store';
import { mapFormFieldsToQuery } from '../utils/query';
import { getQueryAttributes, isQueryEqual } from '../utils';
import type { FavoriteQuery } from '@mongodb-js/my-queries-storage';

const EVENT = 'compass-collection-documents-tab-saved-query-name';

type AppRegistryWithEmit = {
  emit(eventName: string, ...args: unknown[]): boolean;
};

function getMatchedFavoriteName(
  favoriteQueries: FavoriteQuery[],
  fields: RootState['queryBar']['fields']
): string {
  const queryAttributes = getQueryAttributes(mapFormFieldsToQuery(fields));
  const match = favoriteQueries.find((favoriteQuery) => {
    return isQueryEqual(getQueryAttributes(favoriteQuery), queryAttributes);
  });
  return match?._name?.trim() ?? '';
}

/**
 * Keeps collection tab tooltip in sync: when the query bar state matches a
 * saved favorite, the name is the same as shown next to Save in the UI.
 */
export function subscribeMatchedFavoriteNameToCollectionTab(
  store: Store<RootState>,
  localAppRegistry: AppRegistryWithEmit
): () => void {
  const emit = (): void => {
    const {
      queryBar: { fields, favoriteQueries },
    } = store.getState();
    localAppRegistry.emit(
      EVENT,
      getMatchedFavoriteName(favoriteQueries, fields)
    );
  };

  emit();
  return store.subscribe(emit);
}
