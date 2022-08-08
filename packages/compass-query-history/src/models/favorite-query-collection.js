import Collection from 'ampersand-rest-collection';
import FavoriteQuery from './favorite-query';
import storageMixin from 'storage-mixin';

let remote;
try {
  remote = require('@electron/remote');
} catch (e) {
  console.error('Could not load @electron/remote', e.message);
}

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
    basepath: remote ? remote.app.getPath('userData') : undefined,
  },
  mainIndex: '_id',
  comparator: (favorite) => {
    return -favorite._dateSaved;
  },
});

export default FavoriteQueryCollection;
export { FavoriteQueryCollection };
