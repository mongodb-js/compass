const _ = require('lodash');

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
 * Array reduction functions wrapped as javascript functions
 */
const REDUCTIONS = Object.freeze({
  length: function(arr) {
    return {$size: arr};
  },
  max: function(arr) {
    return {$max: arr};
  },
  min: function(arr) {
    return {$min: arr};
  },
  mean: function(arr) {
    return {$avg: arr};
  },
  index: function(arr, args) {
    return {$arrayElemAt: [arr, args[0]]};
  },
  maxStringLength: function(arr) {
    return {$max: {$map: {input: arr, as: 'str', in: {$strLenBytes: '$$str'}}}};
  },
  minStringLength: function(arr) {
    return {$min: {$map: {input: arr, as: 'str', in: {$strLenBytes: '$$str'}}}};
  }
});

function constructUnwindStages(field, reductions) {
  return _(reductions)
    .filter((red) => {
      return red.type === 'unwind';
    })
    .map((red) => {
      return {$unwind: red.field};
    })
    .value();
}

/**
 * Takes a field name and an array of reductions and creates an aggregation
 * pipeline to reduce (possibly nested) arrays to a single scalar value
 * according to the provided reduction functions
 *
 * @param  {String} field        field name of the array as string, no leading `$`
 * @param  {Array} reductions    an array of reductions as defined by the
 *                               ChartStore, with the following format:
 *
 *             [
 *               { field: "foo", type: "max", arguments: [] },
 *               { field: "bar.baz" , type: "index", arguments: [3] }
 *             ]
 *
 *                               The reductions are applied inside out, above
 *                               example would result in `index(max(field), 3)`.
 *
 * @return {Object}              an $addFields aggregation stage that converts
 *                               the given field array into a scalar value.
 */

function constructAccumulatorStage(field, reductions) {
  let arr;
  let expr;

  reductions = _.filter(reductions, (red) => {
    return red.type !== 'unwind';
  });

  if (reductions.length === 0) {
    // if no reductions are present, return empty array
    return null;
  }

  if (reductions.length === 1) {
    // with only one reduction, return the reduction applied to the field
    // directly.
    arr = `$${field}`;
  } else {
    // first reduction has no map and applies the reducer directly
    arr = '$$value';
    expr = REDUCTIONS[reductions[0].type](arr);

    // second to second last reductions use a map but pass $$value down
    reductions.slice(1, -1).forEach((reduction) => {
      arr = _map('$$value', expr);
      expr = REDUCTIONS[reduction.type](arr);
    });

    // last (outer-most) reduction uses the actual field name with a map
    arr = _map(`$${field}`, expr);
  }
  expr = REDUCTIONS[reductions[reductions.length - 1].type](arr);

  // we use $addFields to overwrite the original field name

  return {$addFields: {[field]: expr}};
}

module.exports = function arrayReductionAggBuilder(field, reductions) {
  const pipeline = [];

  const unwindStages = constructUnwindStages(field, reductions);
  const accumulatorStage = constructAccumulatorStage(field, reductions);

  // combine pipeline
  pipeline.push.apply(pipeline, unwindStages);
  if (accumulatorStage) {
    pipeline.push(accumulatorStage);
  }
  return pipeline;
};
