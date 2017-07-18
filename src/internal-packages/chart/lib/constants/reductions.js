const TOOL_TIP_ARRAY_REDUCE = Object.freeze({
  'data-for': 'array-reduce-tooltip',
  'data-tip': 'In order to use fields or values<br/>'
    + 'inside an array, the array has to<br/>'
    + 'be reduced to a scalar value.<br/>'
    + 'Choose from the array reduction<br/>'
    + 'methods.'
});

/**
 * A list of the general array reduction types.
 */
const ARRAY_GENERAL_REDUCTIONS = Object.freeze({
  UNWIND: 'Unwind array',
  LENGTH: 'Array length',
  INDEX: 'Array element by index'  // TODO: Note is args not implemented in React <ArrayReductionPicker>
});

/**
 * A list of the numeric array reduction types, or accumulates.
 */
const ARRAY_NUMERIC_REDUCTIONS = Object.freeze({
  MIN: 'min',
  MAX: 'max',
  MEAN: 'mean',
  SUM: 'sum'
});

/**
 * A list of the string array reduction types, or accumulates.
 */
const ARRAY_STRING_REDUCTIONS = Object.freeze({
  CONCAT: 'concat',
  MIN_LENGTH: 'min length',
  MAX_LENGTH: 'max length',
  LONGEST: 'longest',
  SHORTEST: 'shortest'
});

/**
 * A list of all the array reduction types available.
 */
const ARRAY_REDUCTION_TYPES = Object.freeze(Object.assign(
  {},
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS
));

/**
 * A mechanism to configure the reduction argument fields displayed
 * to the chart user and the validator applied to those fields.
 *
 * Each reduction type should have an ordered array of objects, to be
 * paired up with each argument to be rendered on screen, and each object
 * has the following keys:
 *
 *  - label       the user-facing text to display
 *  - validator   a function which in the pattern of Django ReST framework
 *                returns an updated value if the value is valid,
 *                (e.g. to allow type coercion from string to integer) or
 *                throws a ValidationError if the value is not valid.
 * @see http://www.django-rest-framework.org/api-guide/validators/#writing-custom-validators
 */
const REDUCTION_ARGS_TEMPLATE = Object.freeze({
  [ARRAY_GENERAL_REDUCTIONS.INDEX]: [
    {
      label: 'Index',
      validator: (value) => {
        // Not sure how to warn out of bounds for this field, e.g. array
        // length is 3 but user asks for element 7. Do in a future ticket...
        if (/^-?[0-9]+$/.test(value)) {
          // Coerce to the integer value
          return parseInt(value, 10);
        }
        throw new Error(`ValidationError - Invalid value: ${value}`);
      }
    }
  ]
});

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

module.exports = {
  TOOL_TIP_ARRAY_REDUCE,
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  ARRAY_REDUCTION_TYPES,
  REDUCTION_ARGS_TEMPLATE,
  REDUCTIONS
};
