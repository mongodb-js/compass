import Model from 'ampersand-model';
import { EJSON } from 'bson';
import uuid from 'uuid';

/**
 * A model that represents a MongoDB query.
 */
const Query = Model.extend({
  idAttribute: '_id',
  props: {
    /**
     * The unique identifier for the query.
     */
    _id: {
      type: 'string',
      default: function() {
        return uuid.v4();
      }
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
    _host: 'string'
  },
  parse: function(attrs) {
    return attrs ? EJSON.deserialize(attrs) : undefined;
  },
  serialize: function() {
    return EJSON.serialize(this.getAttributes({ props: true }));
  }
});

export default Query;
export {
  Query
};
