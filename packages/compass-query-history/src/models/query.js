import Model from 'ampersand-model';
import uuid from 'uuid';
import { EJSON } from 'bson';

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
    _ns: 'string'
  },
  parse: function(attrs) {
    return EJSON.deserialize(attrs);
  },
  serialize: function() {
    return EJSON.serialize(this.getAttributes({ props: true }));
  }
});

export default Query;
export {
  Query
};
