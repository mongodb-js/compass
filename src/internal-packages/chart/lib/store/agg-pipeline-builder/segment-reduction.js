const _ = require('lodash');
const { ARRAY_GENERAL_REDUCTIONS } = require('../../constants');
const { REDUCTIONS } = require('./constants');


/**
 * map wrapper around aggregation framework $map. Applies `expr` function
 * to each element in the array `arr`. Returns the agg framework operators
 * to represent the mapping.
 *
 * @param       {Array} arr       array to map over
 * @param       {Function} expr   function to apply to each element in the array
 * @return      {Array}           resulting array
 */
function _map(arr, expr) {
  return {
    $map: {
      input: arr,
      as: 'value',
      in: expr
    }
  };
}

/**
 * Filters out all unwind reductions from the reductions array and builds
 * $unwind stages for the respective fields.
 *
 * @param  {Array} reductions   array of reductions, following the following
 *
 * @return {Array}              array of $unwind stages, might be empty
 */
function constructUnwindStages(reductions) {
  return _(reductions)
    .filter((reduction) => {
      return reduction.type === ARRAY_GENERAL_REDUCTIONS.UNWIND;
    })
    .map((reduction) => {
      return { $unwind: `$${ reduction.field }`};
    })
    .value();
}

/**
 * Takes an array of reductions and creates an aggregation pipeline stage
 * to reduce (possibly nested) arrays to a single scalar value according to
 * the provided reduction functions
 *
 * @param  {Array} reductions    an array of reductions as defined by the
 *                               ChartStore, with the following format:
 *
 *             [
 *               { field: "foo", type: "max", arguments: [] },
 *               { field: "bar.baz" , type: "index", arguments: [3] }
 *             ]
 *
 *                               The reductions are applied outside inwards, above
 *                               example would result in `max(index(field, 3))`.
 *
 * @param {String}  channel      The channel name, used for creating unique alias
 * @param  {Object} aliaser      an AggregationAliaser instance
 * @return {Object}              an $addFields aggregation stage that converts
 *                               the given field array into a scalar value.
 */
function constructAccumulatorStage(reductions, channel, aliaser) {
  let arr;
  let expr;

  reductions = _.filter(reductions, (reduction) => {
    return reduction.type !== ARRAY_GENERAL_REDUCTIONS.UNWIND;
  });

  // compute the array names relative to their parent array name
  if (reductions.length > 0) {
    reductions[0].relativeArrayName = reductions[0].field;
    for (let i = 1; i < reductions.length; i++) {
      const prefix = reductions[i - 1].field;
      reductions[i].relativeArrayName = reductions[i].field.replace(new RegExp(`^${prefix}\.`), '');
    }
  }

  // reverse the array (without modifying original), below code assumes inside->out order
  reductions = reductions.slice().reverse();
  const lastReduction = reductions[reductions.length - 1];

  if (reductions.length === 0) {
    // if no reductions are present, return empty array
    return null;
  }

  if (reductions.length === 1) {
    // with only one reduction, return the reduction applied to the field
    // directly.
    arr = `$${ lastReduction.field }`;
  } else if (reductions.length > 1) {
    // first (inner-most) reduction has no map and applies the reducer expression directly
    arr = `$$value.${ reductions[0].relativeArrayName }`;
    expr = REDUCTIONS[reductions[0].type](arr);

    // second to second last reductions use a map but pass $$value down
    reductions.slice(1, -1).forEach((reduction) => {
      arr = _map(`$$value.${ reduction.relativeArrayName }`, expr);
      expr = REDUCTIONS[reduction.type](arr);
    });

    // last reduction uses the actual field name with a map
    arr = _map(`$${ lastReduction.field }`, expr);
  }
  expr = REDUCTIONS[lastReduction.type](arr);

  // we use $addFields to overwrite the original field name
  const alias = aliaser.assignUniqueAlias(reductions[0].field, channel);
  return {$addFields: {[alias]: expr}};
}


/**
 * constructs the pipeline stages to reduce arrays for a single channel.
 * Calls are made to _constructUnwindStages and _constructAccumulatorStage,
 * as both are possible array reductions.
 *
 * @param  {Array} reductions   reductions array for a single channel
 * @param  {String} channel     current channel name
 * @param  {Object} aliaser     an AggregationAliaser instance
 * @return {Array}              resulting aggregation pipeline
 */
function reduceArraysPerChannel(reductions, channel, aliaser) {
  const pipeline = [];
  const unwindStages = constructUnwindStages(reductions);
  const accumulatorStage = constructAccumulatorStage(reductions, channel, aliaser);

  // combine pipeline
  pipeline.push.apply(pipeline, unwindStages);
  if (accumulatorStage) {
    pipeline.push(accumulatorStage);
  }
  return pipeline;
}


/**
 * main entry point for array reductions. Calls the reduceArrayPerChannel
 * function for each channel and combines the results.
 *
 * @param  {Object} state     chart store state
 * @param  {Object} aliaser   an AggregationAliaser instance
 * @return {Array}            resulting aggregation segment
 */
function constructReductionSegment(state, aliaser) {
  const result = [];

  // return early if no reductions are present
  if (!_.has(state, 'reductions') || _.isEmpty(state.reductions)) {
    return result;
  }

  // array reduction for all channels
  const channels = Object.keys(state.reductions);
  const arrayReductionStages = channels.reduce((_pipeline, channel) => {
    const channelReductions = state.reductions[channel];
    const addToPipeline = reduceArraysPerChannel(channelReductions, channel, aliaser);
    return _pipeline.concat(addToPipeline);
  }, []);
  result.push.apply(result, arrayReductionStages);
  return result;
}

module.exports = constructReductionSegment;
