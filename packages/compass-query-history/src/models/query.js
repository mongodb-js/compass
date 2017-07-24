const Model = require('ampersand-model');
const uuid = require('uuid');

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
    projection: 'string',
    /**
     * The query sort.
     */
    sort: 'string',
    /**
     * The query skip.
     */
    skip: 'number',
    /**
     * The query limit.
     */
    limit: 'number',
    /**
     * The query last executed time.
     */
    lastExecuted: 'date'
  }
});

module.exports = Query;
