const _ = require('lodash');
const {
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS
} = require('../constants');

// const debug = require('debug')('mongodb-compass:chart:agg-pipeline-builder');

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
 * Array reduction operators wrapped as javascript functions
 */
const REDUCTIONS = Object.freeze({
  [ARRAY_GENERAL_REDUCTIONS.LENGTH]: function(arr) {
    return {$size: arr};
  },
  [ARRAY_GENERAL_REDUCTIONS.INDEX]: function(arr, args) {
    return {$arrayElemAt: [arr, args[0]]};
  },

  // Numeric reductions
  [ARRAY_NUMERIC_REDUCTIONS.MAX]: function(arr) {
    return {$max: arr};
  },
  [ARRAY_NUMERIC_REDUCTIONS.MIN]: function(arr) {
    return {$min: arr};
  },
  [ARRAY_NUMERIC_REDUCTIONS.MEAN]: function(arr) {
    return {$avg: arr};
  },

  // String reductions
  [ARRAY_STRING_REDUCTIONS.MAX_LENGTH]: function(arr) {
    return {$max: {$map: {input: arr, as: 'str', in: {$strLenCP: '$$str'}}}};
  },
  [ARRAY_STRING_REDUCTIONS.MIN_LENGTH]: function(arr) {
    return {$min: {$map: {input: arr, as: 'str', in: {$strLenCP: '$$str'}}}};
  }
});

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
      return {$unwind: `$${ reduction.field }`};
    })
    .value();
}

/**
 * Takes an array of reductions and creates an aggregation pipeline stage
 * to reduce (possibly nested) arrays to a single scalar value according to
 * the provided reduction functions
 *
 * @todo (thomas) I'm pretty sure the use case of array with sub docs with
 * nested arrays is not yet working, as all but the first array to map over
 * only use `$$value` so the other field names are not used anywhere yet.
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
 * @return {Object}              an $addFields aggregation stage that converts
 *                               the given field array into a scalar value.
 */
function constructAccumulatorStage(reductions) {
  let arr;
  let expr;

  reductions = _.filter(reductions, (reduction) => {
    return reduction.type !== ARRAY_GENERAL_REDUCTIONS.UNWIND;
  });

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
    arr = `$${lastReduction.field}`;
  } else {
    // first (inner-most) reduction has no map and applies the reducer expression directly
    arr = '$$value';
    expr = REDUCTIONS[reductions[0].type](arr);

    // second to second last reductions use a map but pass $$value down
    reductions.slice(1, -1).forEach((reduction) => {
      arr = _map('$$value', expr);
      expr = REDUCTIONS[reduction.type](arr);
    });

    // last (outer-most) reduction uses the actual field name with a map
    arr = _map(`$${lastReduction.field}`, expr);
  }
  expr = REDUCTIONS[lastReduction.type](arr);

  // we use $addFields to overwrite the original field name
  return {$addFields: {[lastReduction.field]: expr}};
}

/**
 * constructs the pipeline stages to reduce arrays for a single channel.
 *
 * @param  {Array} reductions   the reductions array for a single channel
 * @return {Array}              the resulting aggregation pipeline
 */
function reduceArrays(reductions) {
  const pipeline = [];
  const unwindStages = constructUnwindStages(reductions);
  const accumulatorStage = constructAccumulatorStage(reductions);

  // combine pipeline
  pipeline.push.apply(pipeline, unwindStages);
  if (accumulatorStage) {
    pipeline.push(accumulatorStage);
  }
  return pipeline;
}

/**
 * helper to create aggregation pipeline stages to reduce arrays, based on
 * the given reductions array.
 *
 * @param  {Array} state   chart store state
 * @return {Array}         pipeline stages to reduce all arrays
 */
module.exports = function aggPipelineBuilder(state) {
  // array reduction for all channels
  const channels = Object.keys(state.reductions);
  const pipeline = channels.reduce((_pipeline, channel) => {
    const channelReductions = state.reductions[channel];
    const addToPipeline = reduceArrays(channelReductions);
    return _pipeline.concat(addToPipeline);
  }, []);

  return pipeline;
};
