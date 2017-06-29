const {
  ALIAS_PREFIX_ENUM,
  ARRAY_REDUCTION_TYPES,
  AGGREGATE_FUNCTION_ENUM
} = require('../constants');
const _ = require('lodash');

/**
 * takes a field name, an alias prefix (currently only ALIAS_PREFIX_ENUM.REDUCTION
 * or ALIAS_PREFIX_ENUM.AGGREGATE) and a operator (which is either an reduction
 * type or an aggregate type), and returns an alias for the field name.
 *
 * Example: an array reduction of `unwind` on the field `foo` returns: red_unwind_foo
 *
 * @param  {String} field       field name
 * @param  {String} aliasType   alias type, currently `red` or `agg` (defined
 *                              in ALIAS_PREFIX_ENUM)
 * @param  {String} operator    the applied operator, depending on aliasType,
 *                              either one of ARRAY_REDUCTION_TYPES or
 *                              AGGREGATE_FUNCTION_ENUM.
 *
 * @return {String}             the aliased field name
 */
module.exports = function createFieldAlias(field, aliasType, operator) {
  if (!_.includes(_.values(ALIAS_PREFIX_ENUM), aliasType)) {
    throw new Error(`Unknown alias type "${aliasType}".` +
      `Must be one of ${Object.keys(ALIAS_PREFIX_ENUM)}`);
  }

  let operatorKey;
  if (aliasType === ALIAS_PREFIX_ENUM.REDUCTION) {
    // Check types are valid members of ARRAY_REDUCTION_TYPES
    operatorKey = _.findKey(ARRAY_REDUCTION_TYPES, (val) => val === operator);
    if (operatorKey === undefined) {
      throw new Error(`Expect a reduction operator, got: ${operator}`);
    }
    return `${ALIAS_PREFIX_ENUM.REDUCTION}_${operatorKey.toLowerCase()}_${field}`;
  }

  if (aliasType === ALIAS_PREFIX_ENUM.AGGREGATE) {
    // Check types are valid members of ARRAY_REDUCTION_TYPES
    operatorKey = _.findKey(AGGREGATE_FUNCTION_ENUM, (val) => val === operator);
    if (operatorKey === undefined) {
      throw new Error(`Expect an aggregate operator, got: ${operator}`);
    }
    return `${ALIAS_PREFIX_ENUM.AGGREGATE}_${operatorKey.toLowerCase()}_${field}`;
  }
};
