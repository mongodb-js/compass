import { remote } from 'electron';
import Query from './query';
import storageMixin from 'storage-mixin';

/**
 * A model that represents a recent MongoDB query.
 */
const RecentQuery = Query.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'RecentQueries',
  storage: {
    backend: 'disk',
    basepath: process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH || remote.app.getPath('userData')
  }
});

export default RecentQuery;
export { RecentQuery };
