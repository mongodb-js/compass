import Query from './query';
import storageMixin from 'storage-mixin';

let remote;
try {
  remote = require('@electron/remote');
} catch (e) {
  console.error('Could not load @electron/remote', e.message);
}

/**
 * A model that represents a favorite MongoDB query.
 */
const FavoriteQuery = Query.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'FavoriteQueries',
  storage: {
    backend: 'disk',
    basepath: remote ? remote.app.getPath('userData') : undefined,
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
