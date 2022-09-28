import Query from './query';
import storageMixin from 'storage-mixin';
import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

/**
 * A model that represents a favorite MongoDB query.
 */
const FavoriteQuery = Query.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'FavoriteQueries',
  storage: {
    backend: 'disk',
    basepath,
  },
  props: {
    /**
     * The query name.
     */
    _name: 'string',
    /**
     * When was the favorite saved
     */
    _dateSaved: 'date',
    /**
     * When was the favorite modified
     */
    _dateModified: 'date',
  },
});

export default FavoriteQuery;
export { FavoriteQuery };
