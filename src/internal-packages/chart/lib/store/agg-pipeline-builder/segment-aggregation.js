const _ = require('lodash');
const { AGGREGATIONS } = require('../../constants');

/**
 * builds the segment of the pipeline that executes aggregations across
 * documents on the server, instead of the client in vega-lite.
 *
 * The following strategy is used (using terminology from
 * https://vega.github.io/vega-lite/docs/aggregate.html):
 *
 * 1. Identify all dependent fields/measures (channels with "aggregate")
 * 2. Identify all independent fields/dimensions (channels without "aggregate")
 * 3. Create a $group stage and group by (_id) a compound object containing
 *    all dimensions (use aliases because of nested fields), e.g.
 *
 *    {_id: {"__alias_0": "$dim1", __alias_1: "$dim2"}}
 *
 * 4. Add a field (use aliases because of nested fields) to the group
 *    object for each measure, e.g.
 *
 *    {_id: {...}, __alias_2: {$min: "$meas1"}, __alias_3: {$avg: "$meas2"}}
 *
 * 5. Add another stage that unwraps the group key back to top-level fields
 *    and removes the _id key. It also needs to include all measures, e.g.
 *
 *    {
 *      $project: {
 *        _id: 0,                           // exclude _id
 *        "__alias_0": "$_id.__alias_0",    // independent fields/dimensions
 *        "__alias_1": "$_id.__alias_1",
 *        "__alias_2": 1,                   // dependent fields/measures
 *        "__alias_3": 1
 *      }
 *    }
 *
 * @param  {Object} state     chart store state
 * @param  {Object} aliaser   an AggregationAliaser instance
 * @return {Array}            resulting aggregation segment
 */
function constructAggregationSegment(state, aliaser) {
  const result = [];

  // return early if no channels are present
  if (!_.has(state, 'channels') || _.isEmpty(state.channels)) {
    return result;
  }

  // step 1, identify measures
  const measures = _(state.channels)
    .pick(encoding => encoding.aggregate)
    .map((encoding, channel) => {
      return [encoding.field, channel];
    })
    .zipObject()
    .value();

  if (Object.keys(measures).length === 0) {
    // no aggregations required, return early
    return result;
  }

  // step 2, identify dimensions
  const dimensions = _(state.channels)
    .pick(encoding => !encoding.aggregate)
    .map((encoding, channel) => {
      return [encoding.field, channel];
    })
    .zipObject()
    .value();

  // step 3, create group key for all dimensions
  // note: this also works for zero dimensions, where the group key is
  // the empty object {}. This is correct behavior as the entire dataset
  // is reduced to a single value.
  const groupKey = _(dimensions)
    .map((channel, field) => {
      const alias = aliaser.getAlias(field, channel) || field;
      return [aliaser.assignUniqueAlias(field, channel), `$${alias}`];
    })
    .zipObject()
    .value();

  // step 4, create object of all aggregate functions with aliased names
  const groupAggregates = _(measures)
    .map((channel, field) => {
      const alias = aliaser.getAlias(field, channel) || field;
      const aggregation = AGGREGATIONS[state.channels[channel].aggregate](alias).groupStage;
      return [aliaser.assignUniqueAlias(field, channel), aggregation];
    })
    .zipObject()
    .value();

  // merge group key and aggregates for the final $group stage
  const groupStage = {$group: _.assign({_id: groupKey}, groupAggregates)};

  // step 5, create $project stage to heist group key fields back to top level
  const projections = {_id: 0};
  // dimensions(their aliases) need to be lifted to the top level
  _.each(dimensions, (channel, field) => {
    const alias = aliaser.getAlias(field, channel);
    projections[alias] = `$_id.${alias}`;
  });
  // measures (their aliases) with 1-stage aggregations just need to be
  // included in the $project stage, 2-stage aggregations inject their
  // second part into the $project stage here.
  _.each(measures, (channel, field) => {
    const alias = aliaser.getAlias(field, channel);
    // check if this aggregation needs to inject into the $project stage.
    // if it does, get the expression here, otherwise just use a 1 as value
    // so the field is included in the final result.
    const projection = AGGREGATIONS[state.channels[channel].aggregate](alias).projectStage;
    projections[alias] = projection || 1;
  });
  const projectStage = {$project: projections};

  // push the resulting stages into the aggregation segment
  result.push(groupStage);
  result.push(projectStage);
  return result;
}

module.exports = constructAggregationSegment;
