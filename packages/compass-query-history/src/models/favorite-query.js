import { remote } from 'electron';
import Query from './query';
import storageMixin from 'storage-mixin';

/**
 * A model that represents a favorite MongoDB query.
 */
const FavoriteQuery = Query.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'FavoriteQueries',
  storage: {
    backend: 'disk',
    basepath: remote.app.getPath('userData')
  },
  props: {
    /**
     * The query name.
     */
    _name: 'string',
    /**
     * When was the favorite saved
     */
    _dateSaved: 'date'
  }
});

export default FavoriteQuery;
export { FavoriteQuery };
