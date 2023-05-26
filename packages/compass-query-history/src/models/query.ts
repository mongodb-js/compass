import Model from 'ampersand-model';
import { EJSON } from 'bson';
import uuid from 'uuid';
import type { Document, CollationOptions } from 'mongodb';

// Note: This is not type safe as we aren't typing this
// directly with the ampersand model. When we change the model
// we need to also change this type.
export type QueryAttributes = {
  _id: string;
  _ns: string;
  _host?: string;

  _lastExecuted: Date | number;

  filter: Document;
  project: Document;
  sort: Document;
  skip: number;
  limit: number;
  collation: CollationOptions;
};

export type AmpersandModelType<T> = T & {
  getAttributes: (options?: { props: boolean }) => T;
  destroy: (options?: { success: () => void; error: () => void }) => void;
  save: () => void;
};

export type QueryModelType = AmpersandModelType<QueryAttributes>;

/**
 * A model that represents a MongoDB query.
 * Note: This is not type safe as we aren't typing this
 * directly with the ampersand model. When we change this model
 * we need to also change the `QueryAttributes` type above.
 */
const Query = Model.extend({
  idAttribute: '_id',
  props: {
    /**
     * The unique identifier for the query.
     */
    _id: {
      type: 'string',
      default: function () {
        return uuid.v4();
      },
    },
    /**
     * The query filter.
     */
    filter: 'object',
    /**
     * The query projection.
     */
    project: 'object',
    /**
     * The query sort.
     */
    sort: 'object',
    /**
     * The query skip.
     */
    skip: 'number',
    /**
     * The query limit.
     */
    limit: 'number',
    /**
     * The collation.
     */
    collation: 'object',
    /**
     * The query last executed time.
     */
    _lastExecuted: 'date',
    /**
     * The namespace the query was executed on.
     */
    _ns: 'string',
    /**
     * Current connection hosts
     */
    _host: 'string',
  },
  parse: function (attrs: QueryAttributes) {
    return attrs ? EJSON.deserialize(attrs) : undefined;
  },
  serialize: function () {
    return EJSON.serialize(this.getAttributes({ props: true }));
  },
});

export default Query;
export { Query };
