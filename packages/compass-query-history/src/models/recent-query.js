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
    basepath: remote ? remote.app.getPath('userData') : undefined,
  },
});

export default RecentQuery;
export { RecentQuery };
