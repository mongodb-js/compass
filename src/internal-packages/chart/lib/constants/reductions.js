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

module.exports = {
  TOOL_TIP_ARRAY_REDUCE,
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  ARRAY_REDUCTION_TYPES
};
