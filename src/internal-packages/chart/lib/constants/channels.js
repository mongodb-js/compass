/**
 * An enumeration of the subset of Vega-Lite aggregates we support.
 * For a full list of things we could add, see:
 *
 * @see https://vega.github.io/vega-lite/docs/aggregate.html
 */
const AGGREGATE_FUNCTION_ENUM = Object.freeze({
  NONE: '(none)',
  COUNT: 'count',
  DISTINCT: 'distinct',
  SUM: 'sum',
  MEAN: 'mean',
  VARIANCE: 'variance',
  VARIANCEP: 'variancep',
  STDEV: 'stdev',
  STDEVP: 'stdevp',
  // MEDIAN: 'median',
  // Q1: 'q1',           not supported in agg framework, comment out for now
  // Q3: 'q3',
  MIN: 'min',
  MAX: 'max'
});

/**
 * An enumeration of valid Mark Properties Channels.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#props-channels
 */
const MARK_PROPERTY_CHANNEL_ENUM = Object.freeze({
  X: 'x',
  Y: 'y',
  COLOR: 'color',
  OPACITY: 'opacity',
  SHAPE: 'shape',
  SIZE: 'size',
  TEXT: 'text'
  // Not doing row/column faceting yet
});

/**
 * An enumeration for the Detail Channel.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#additional-level-of-detail-channel
 */
const DETAIL_CHANNEL_ENUM = Object.freeze({
  DETAIL: 'detail'
});

// Omit for V1 unless we find a compelling use case :)
// https://vega.github.io/vega-lite/docs/encoding.html#mark-order-channels
// const ORDER_CHANNEL_ENUM = ...
// https://vega.github.io/vega-lite/docs/encoding.html#facet
// const FACET_CHANNEL_ENUM = ...

/**
 * Bundle of all valid Vega-Lite channel types we plan to support in Compass.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#channels
 */
const CHART_CHANNEL_ENUM = Object.freeze(Object.assign({},
    MARK_PROPERTY_CHANNEL_ENUM,
    DETAIL_CHANNEL_ENUM
));

/**
 * An enumeration of the valid Data Type, or Measurement values.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#data-type
 */
const MEASUREMENT_ENUM = Object.freeze({
  NOMINAL: 'nominal',
  ORDINAL: 'ordinal',
  QUANTITATIVE: 'quantitative',
  TEMPORAL: 'temporal'
});

/**
 * Icons to measurement mapping
 * @type {Class} font-awesome icons
 */
const MEASUREMENT_ICON_ENUM = Object.freeze({
  [MEASUREMENT_ENUM.NOMINAL]: 'font',
  [MEASUREMENT_ENUM.ORDINAL]: 'sort-amount-asc',
  [MEASUREMENT_ENUM.QUANTITATIVE]: 'hashtag',
  [MEASUREMENT_ENUM.TEMPORAL]: 'calendar'
});

/**
 * Aggregations across documents wrapped as JavaScript function. The shape of
 * an aggregation is defined as:
 *
 *    {
 *      groupStage: {...},     // always required
 *      projectStage: {...}    // optional
 *    }
 *
 * If the aggregation only requires a single stage (group accumulators like
 * sum, mean, ...) then just return the object with a `groupStage` value.
 *
 * If the aggregation requires a subsequent $project stage, (e.g. distinct,
 * which needs an $addToSet followed by a $size projection), return an object
 * with both `groupStage` and `projectStage` values.
 */
const AGGREGATIONS = Object.freeze({
  [AGGREGATE_FUNCTION_ENUM.COUNT]: function() {
    return {
      groupStage: {
        $sum: 1
      }
    };
  },
  /**
   * Returns the number of distinct values per group. This operation requires
   * a $group and $project stage, therefore returning array of two elements.
   *
   * @param {String} field   field name to operate on
   * @returns {Object}       aggregation pipeline operators
   */
  [AGGREGATE_FUNCTION_ENUM.DISTINCT]: function(field) {
    return {
      groupStage: {
        $addToSet: `$${field}`
      },
      projectStage: {
        $size: `$${field}`
      }
    };
  },
  [AGGREGATE_FUNCTION_ENUM.SUM]: function(field) {
    return {
      groupStage: {
        $sum: `$${field}`
      }
    };
  },
  [AGGREGATE_FUNCTION_ENUM.MEAN]: function(field) {
    return {
      groupStage: {
        $avg: `$${field}`
      }
    };
  },
  [AGGREGATE_FUNCTION_ENUM.MIN]: function(field) {
    return {
      groupStage: {
        $min: `$${field}`
      }
    };
  },
  [AGGREGATE_FUNCTION_ENUM.MAX]: function(field) {
    return {
      groupStage: {
        $max: `$${field}`
      }
    };
  },
  [AGGREGATE_FUNCTION_ENUM.STDEV]: function(field) {
    return {
      groupStage: {
        $stdDevSamp: `$${field}`
      }
    };
  },
  /**
   * Returns the variance over the samples per group. This operation requires
   * a $group and $project stage, therefore returning array of two elements.
   *
   * @param {String} field   field name to operate on
   * @returns {Object}       aggregation pipeline operators
   */
  [AGGREGATE_FUNCTION_ENUM.VARIANCE]: function(field) {
    return {
      groupStage: {
        $stdDevSamp: `$${field}`
      },
      projectStage: {
        $pow: [`$${field}`, 2]
      }
    };
  },
  [AGGREGATE_FUNCTION_ENUM.STDEVP]: function(field) {
    return {
      groupStage: {
        $stdDevPop: `$${field}`
      }
    };
  },
  /**
   * Returns the population variance per group. This operation requires
   * a $group and $project stage, therefore returning array of two elements.
   *
   * @param {String} field   field name to operate on
   * @returns {Object}       aggregation pipeline operators
   */
  [AGGREGATE_FUNCTION_ENUM.VARIANCEP]: function(field) {
    return {
      groupStage: {
        $stdDevPop: `$${field}`
      },
      projectStage: {
        $pow: [`$${field}`, 2]
      }
    };
  }
});

module.exports = {
  AGGREGATE_FUNCTION_ENUM,
  AGGREGATIONS,
  CHART_CHANNEL_ENUM,
  MEASUREMENT_ENUM,
  MEASUREMENT_ICON_ENUM
};
