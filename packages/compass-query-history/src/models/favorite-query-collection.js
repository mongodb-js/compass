import Collection from 'ampersand-rest-collection';
import FavoriteQuery from './favorite-query';
import storageMixin from 'storage-mixin';
import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

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
  comparator: (favorite) => {
    return -favorite._dateSaved;
  },
});

export default FavoriteQueryCollection;
export { FavoriteQueryCollection };
