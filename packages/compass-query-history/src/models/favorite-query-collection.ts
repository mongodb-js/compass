import Collection from 'ampersand-rest-collection';
import storageMixin from 'storage-mixin';
import { getStoragePaths } from '@mongodb-js/compass-utils';

import FavoriteQuery from './favorite-query';
import type { FavoriteQueryModelType } from './favorite-query';
import type { AmpersandCollectionType } from './recent-query-collection';

const { basepath } = getStoragePaths() || {};

export type FavoriteQueryAmpersandCollectionType =
  AmpersandCollectionType<FavoriteQueryModelType>;

/**
 * Represents a collection of favorite queries.
 */
const FavoriteQueryCollection = Collection.extend(storageMixin, {
  /**
   * Contains FavoriteQuery models.
   */
  model: FavoriteQuery,
  /**
   * Namespace to store in.
   */
  namespace: 'FavoriteQueries',
  storage: {
    backend: 'disk',
    basepath,
  },
  mainIndex: '_id',
  comparator: (favorite: FavoriteQueryModelType) => {
    return -favorite._dateSaved;
  },
});

export default FavoriteQueryCollection;
export { FavoriteQueryCollection };
