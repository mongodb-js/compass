const Model = require('ampersand-model');
const uuid = require('uuid');
const queryParser = require('mongodb-query-parser');

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
     * The query last executed time.
     */
    _lastExecuted: 'date',
    /**
     * The namespace the query was executed on.
     */
    _ns: 'string'
  }
});

/**
 * Format the provided attribute into a pretty-printed version
 * of what would appear in the query bar.
 *
 * @param {Object} value - The value to format.
 */
const format = (value) => {
  return queryParser.toJSString(value);
};

module.exports = Query;
module.exports.format = format;
