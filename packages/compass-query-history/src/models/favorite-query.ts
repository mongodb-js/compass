import storageMixin from 'storage-mixin';
import { getStoragePaths } from '@mongodb-js/compass-utils';

import Query from './query';
import type { AmpersandModelType, QueryAttributes } from './query';

const { basepath } = getStoragePaths() || {};

// Note: this is coupled with the ampersand model below.
export type FavoriteQueryAttributes = QueryAttributes & {
  _name: string;
  _dateSaved: number; // Milliseconds since epoch.
  _dateModified: number; // Milliseconds since epoch.
};

export type FavoriteQueryModelType =
  AmpersandModelType<FavoriteQueryAttributes>;

/**
 * A model that represents a favorite MongoDB query.
 * Note: This is not type safe as we aren't typing this
 * directly with the ampersand model. When we change this model
 * we need to also change the `FavoriteQueryAttributes` type above.
 */
const FavoriteQuery = Query.extend(storageMixin, {
  idAttribute: '_id',
  namespace: 'FavoriteQueries',
  storage: {
    backend: 'disk',
    basepath,
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
