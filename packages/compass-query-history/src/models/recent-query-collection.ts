import Collection from 'ampersand-rest-collection';
import storageMixin from 'storage-mixin';
import { getStoragePaths } from '@mongodb-js/compass-utils';

import RecentQuery from './recent-query';
import type { QueryModelType } from './query';

const { basepath } = getStoragePaths() || {};

export type AmpersandCollectionType<T> = {
  // TODO: success and error handlers?
  add: (queryModel: T) => void;
  remove: (queryId: string) => void;
  fetch: () => void;
} & Array<T>;

export type RecentQueryAmpersandCollectionType =
  AmpersandCollectionType<QueryModelType>;

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
  comparator: (recent: QueryModelType) => {
    return -recent._lastExecuted;
  },
});

export default RecentQueryCollection;
export { RecentQueryCollection };
