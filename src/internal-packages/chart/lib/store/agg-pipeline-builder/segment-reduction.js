const _ = require('lodash');
const { ARRAY_GENERAL_REDUCTIONS } = require('../../constants');
const { REDUCTIONS } = require('./constants');


/**
 * map wrapper around aggregation framework $map. Applies `expr` function
 * to each element in the array `arr`. Returns the agg framework operators
 * to represent the mapping.
 *
 * @param   {Array}    arr   array to map over
 * @param   {Function} expr  function to apply to each element in the array
 *
 * @return  {Array}          resulting array
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
 * @param  {Array} reductions     an array of reductions as defined by the
 *                                ChartStore, with the following format:
 *
 *             [
 *               { field: "foo", type: "max", arguments: [] },
 *               { field: "bar.baz" , type: "index", arguments: [3] }
 *             ]
 *
 *                                The reductions are applied outside inwards, above
 *                                example would result in `max(index(field, 3))`.
 *
 * @param  {String} channel       The channel name, used for creating unique alias
 * @param  {String} encodedField  Field to encode
 * @param  {Object} aliaser       an AggregationAliaser instance
 *
 * @return {Object}               an $addFields aggregation stage that converts
 *                                the given field array into a scalar value.
 */
function constructAccumulatorStage(reductions, channel, encodedField, aliaser) {
  let arr;
  let expr;

  reductions = _.filter(reductions, (reduction) => {
    return reduction.type !== ARRAY_GENERAL_REDUCTIONS.UNWIND;
  });

  if (reductions.length === 0) {
    // if no reductions are present, return empty array
    return null;
  }

  // In order to build the complex expression to handle multiple array reductions below,
  // we need to know the path names of each field in a reduction relative to the previous
  // reduction field. E.g. if the first reduction is on "a.b" and the next is on "a.b.c.d.e"
  // then the relative field is "c.d.e", which can later be appended to "$$value." in the expression.
  if (reductions.length === 1) {
    // with only one reduction, return the reduction applied to the field
    // directly.
    arr = `$${ encodedField }`;
  } else if (reductions.length > 1) {
    reductions[0].relativeFieldPath = reductions[0].field;
    // assign relativeFieldPath to each reduction (Remove path information)
    for (let i = 1; i < reductions.length; i++) {
      const prefix = reductions[i - 1].field;
      reductions[i].relativeFieldPath = reductions[i].field.replace(new RegExp(`^${prefix}\.`), '');
    }

    // reverse the array (without modifying original), below code assumes inside->out order
    reductions = reductions.slice().reverse();

    // If the inner reduction doesn't match the encodedField add its relative array name
    if (encodedField !== reductions[0].field) {
      reductions[0].relativeFieldPath = encodedField.replace(new RegExp(`^${reductions[1].field}\.`), '');
    }

    // first (inner-most) reduction has no map and applies the reducer expression directly
    arr = `$$value.${ reductions[0].relativeFieldPath }`;
    expr = REDUCTIONS[reductions[0].type](arr);

    // second to second last reductions use a map but pass $$value down
    reductions.slice(1, -1).forEach((reduction) => {
      arr = _map(`$$value.${ reduction.relativeFieldPath }`, expr);
      expr = REDUCTIONS[reduction.type](arr);
    });

    // last reduction uses the actual field name with a map
    arr = _map(`$${ reductions[reductions.length - 1].field }`, expr);
  }
  expr = REDUCTIONS[reductions[reductions.length - 1].type](arr);

  // we use $addFields to overwrite the original field name
  const alias = aliaser.assignUniqueAlias(encodedField, channel);
  return {$addFields: {[alias]: expr}};
}


/**
 * constructs the pipeline stages to reduce arrays for a single channel.
 * Calls are made to _constructUnwindStages and _constructAccumulatorStage,
 * as both are possible array reductions.
 *
 * @param  {Array}  reductions    reductions array for a single channel
 * @param  {String} channel       current channel name
 * @param  {String} encodedField  field to encode
 * @param  {Object} aliaser       an AggregationAliaser instance
 *
 * @return {Array}                resulting aggregation pipeline
 */
function reduceArraysPerChannel(reductions, channel, encodedField, aliaser) {
  const pipeline = [];
  const unwindStages = constructUnwindStages(reductions);
  const accumulatorStage = constructAccumulatorStage(reductions, channel, encodedField, aliaser);

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
 * @param  {Object} state    chart store state
 * @param  {Object} aliaser  an AggregationAliaser instance
 *
 * @return {Array}           resulting aggregation segment
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
    const encodedField = state.channels[channel].field;
    const addToPipeline = reduceArraysPerChannel(channelReductions, channel, encodedField, aliaser);
    return _pipeline.concat(addToPipeline);
  }, []);
  result.push.apply(result, arrayReductionStages);
  return result;
}

module.exports = constructReductionSegment;
