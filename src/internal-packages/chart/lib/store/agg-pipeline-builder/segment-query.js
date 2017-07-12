const _ = require('lodash');

/**
 * add $filter, $sort, $skip, $sample or $limit stage to the query segment.
 *
 * @param   {Array} state  chart store state
 * @returns {Array}        resulting pipeline segment
 */
function constructQuerySegment(state) {
  const result = [];

  if (_.has(state, 'queryCache') && !_.isEmpty(state.queryCache)) {
    if (!_.isEmpty(state.queryCache.filter)) {
      result.push({$match: state.queryCache.filter});
    }
    if (!_.isEmpty(state.queryCache.sort)) {
      result.push({$sort: state.queryCache.sort});
    }
    if (state.queryCache.skip) {
      result.push({$skip: state.queryCache.skip});
    }
    if (state.queryCache.sample) {
      result.push({$sample: {size: state.queryCache.limit || 1000}});
    } else if (state.queryCache.limit) {
      result.push({$limit: state.queryCache.limit});
    }
  }

  return result;
}

module.exports = constructQuerySegment;
