import { remote } from 'electron';
import Collection from 'ampersand-rest-collection';
import RecentQuery from './recent-query';
import storageMixin from 'storage-mixin';

/**
 * Represents a collection of recent queries.
 */
const RecentQueryCollection = Collection.extend(storageMixin, {
  /**
   * Contains RecentQuery models.
   */
  model: RecentQuery,
  /**
   * Namespace to store in.
   */
  namespace: 'RecentQueries',
  storage: {
    backend: 'disk',
    basepath: remote.app.getPath('userData')
  },
  mainIndex: '_id',
  comparator: (recent) => {
    return -recent._lastExecuted;
  }
});

export default RecentQueryCollection;
export { RecentQueryCollection };
