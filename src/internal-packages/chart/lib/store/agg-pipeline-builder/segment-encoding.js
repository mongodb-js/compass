const _ = require('lodash');

/**
 * The final segment of the aggregation pipeline, to flatten the documents
 * and encode the fields with the channel names. During this process,
 * previously assigned temporary aliases are also resolved.
 *
 * @param  {Object} state     chart store state
 * @param  {Object} aliaser   an AggregationAliaser instance
 * @return {Array}            resulting aggregation segment
 */
function constructEncodingSegment(state, aliaser) {
  const result = [];

  // project encoded fields to top-level using their channel name
  if (_.has(state, 'channels') && !_.isEmpty(state.channels)) {
    const projectStage = _.reduce(_.pick(state.channels, _.isObject), (_project, encoding, channel) => {
      // check if the field name has an alias, otherwise use original field name
      const alias = aliaser.getAlias(encoding.field, channel) || encoding.field;
      _project[channel] = `$${ alias }`;
      return _project;
    }, {});

    // drop _id in result
    projectStage._id = 0;
    result.push({$project: projectStage});
  }
  return result;
}

module.exports = constructEncodingSegment;
