const {
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  AGGREGATE_FUNCTION_ENUM
} = require('../../constants');

// const debug = require('debug')('mongodb-compass:chart:agg-pipeline-builder');

/**
 * Array reduction operators wrapped as javascript functions.
 */
const REDUCTIONS = Object.freeze({
  [ARRAY_GENERAL_REDUCTIONS.LENGTH]: function(arr) {
    return {
      $cond: {if: {$isArray: arr}, then: {$size: arr}, else: 0}
    };
  },
  [ARRAY_GENERAL_REDUCTIONS.INDEX]: function(arr, args) {
    return {
      $arrayElemAt: [arr, args[0]]
    };
  },

  // Numeric reductions
  [ARRAY_NUMERIC_REDUCTIONS.MAX]: function(arr) {
    return {
      $max: arr
    };
  },
  [ARRAY_NUMERIC_REDUCTIONS.MIN]: function(arr) {
    return {
      $min: arr
    };
  },
  [ARRAY_NUMERIC_REDUCTIONS.MEAN]: function(arr) {
    return {
      $avg: arr
    };
  },
  [ARRAY_NUMERIC_REDUCTIONS.SUM]: function(arr) {
    return {
      $sum: arr
    };
  },

  // String reductions
  [ARRAY_STRING_REDUCTIONS.MAX_LENGTH]: function(arr) {
    return {
      $max: {
        $map: {
          input: arr,
          as: 'str',
          in: {
            $strLenCP: '$$str'
          }
        }
      }
    };
  },
  [ARRAY_STRING_REDUCTIONS.MIN_LENGTH]: function(arr) {
    return {
      $min: {
        $map: {
          input: arr,
          as: 'str',
          in: {
            $strLenCP: '$$str'
          }
        }
      }
    };
  },
  [ARRAY_STRING_REDUCTIONS.CONCAT]: function(arr) {
    return {
      $reduce: {
        input: arr,
        initialValue: '',
        in: {
          $concat: ['$$value', '$$this']
        }
      }
    };
  },
  [ARRAY_STRING_REDUCTIONS.LONGEST]: function(arr) {
    return {
      $reduce: {
        input: arr,
        initialValue: {
          $arrayElemAt: [arr, 0]
        },
        in: {
          $cond: {
            if: {
              $gt: [{$strLenCP: '$$this'}, {$strLenCP: '$$value'}]
            },
            then: '$$this',
            else: '$$value'
          }
        }
      }
    };
  },
  [ARRAY_STRING_REDUCTIONS.SHORTEST]: function(arr) {
    return {
      $reduce: {
        input: arr,
        initialValue: {
          $arrayElemAt: [arr, 0]
        },
        in: {
          $cond: {
            if: {
              $lt: [{$strLenCP: '$$this'}, {$strLenCP: '$$value'}]
            },
            then: '$$this',
            else: '$$value'
          }
        }
      }
    };
  }
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
  REDUCTIONS,
  AGGREGATIONS
};
