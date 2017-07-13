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
  AGGREGATIONS
};
