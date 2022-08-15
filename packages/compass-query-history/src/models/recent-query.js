import Query from './query';
import storageMixin from 'storage-mixin';

let remote;
try {
  remote = require('@electron/remote');
} catch (e) {
  console.error('Could not load @electron/remote', e.message);
}

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
