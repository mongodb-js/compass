import Collection from 'ampersand-rest-collection';
import RecentQuery from './recent-query';
import storageMixin from 'storage-mixin';
import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

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
    basepath,
  },
  mainIndex: '_id',
  comparator: (recent) => {
    return -recent._lastExecuted;
  },
});

export default RecentQueryCollection;
export { RecentQueryCollection };
