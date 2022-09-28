import Query from './query';
import storageMixin from 'storage-mixin';
import { getStoragePaths } from '@mongodb-js/compass-utils';
const { basepath } = getStoragePaths() || {};

/**
 * A model that represents a recent MongoDB query.
 */
const RecentQuery = Query.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'RecentQueries',
  storage: {
    backend: 'disk',
    basepath,
  },
});

export default RecentQuery;
export { RecentQuery };
