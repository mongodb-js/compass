import Collection from 'ampersand-rest-collection';
import RecentQuery from './recent-query';
import storageMixin from 'storage-mixin';

let remote;
try {
  remote = require('@electron/remote');
} catch (e) {
  console.error('Could not load @electron/remote', e.message);
}

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
    basepath: remote ? remote.app.getPath('userData') : undefined,
  },
  mainIndex: '_id',
  comparator: (recent) => {
    return -recent._lastExecuted;
  },
});

export default RecentQueryCollection;
export { RecentQueryCollection };
