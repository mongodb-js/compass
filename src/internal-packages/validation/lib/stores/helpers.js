const _ = require('lodash');
/**
 * Takes a clause and a field name, and constructs an array of 3 clauses
 * which represents the value part of an '$or' query in the context of
 * document validation.
 *
 * For example:
 *
 * Input
 *  - clause: `{$type: 5}`
 *  - field: `email`
 *
 * Results in output:
 * - [{email: {$type: 5}}, {email: {$exists: false}}, {email: null}]
 *
 * @param {Object} clause    The clause (without field name) returned by
 *                           the rules' static paramsToQuery() method
 * @param {String} field     The field name for this clause
 * @return {Array}           array of 3 clauses: the original (wrapped with
 *                           field name), the "exists" and the "null" clause.
 */
function nullableOrQueryWrapper(clause, field) {
  const wrappedClause = {};
  wrappedClause[field] = clause;
  const existsClause = {};
  existsClause[field] = {$exists: false};
  const nullClause = {};
  nullClause[field] = null;
  return [wrappedClause, existsClause, nullClause];
}

/**
 * Takes a rule and a field name, and checks if the rule can be nullable.
 * A nullable query would require a field to be $or with the rule an array
 * with 3 clauses of the same key; exist clause, null clause and wrapped clause.
 *
 * For example:
 *
 * Input
 *  - rule: `{
 *    id: 'my-rule-id',
 *    field: 'name',
 *    category: 'regex',
 *    parameters: {
 *      regex: '^Tom',
 *      options: 'ix'
 *    },
 *    nullable: true
 *  }`
 *  - field: `$or`
 *
 * Results in output:
 * - {field:  'name', value: rule.parameters, nullable: true}
 *
 * @param {String} field     The field name, if it's `$or` could be nullable
 * @param {Object} rule      The rule returned by paramsToQuery
 * @return {Object}          Object with fields field (field name), value (value)
 *                           of the wrappedClause) and nullable (true/false).
 */
function nullableOrValidator(field, rule) {
  const defaultResult = {field: field, value: rule, nullable: false};

  if (field !== '$or') {
    return defaultResult;
  }
  if (!_.isArray(rule)) {
    return defaultResult;
  }
  if (rule.length !== 3) {
    return defaultResult;
  }

  // @todo this is currently hardcoded order of wrapped, exists, null.
  // it would be good to make this more flexible in the future
  const [wrappedClause, existsClause, nullClause] = rule;
  const fieldNames = Object.keys(wrappedClause);

  if (fieldNames.length !== 1) {
    return defaultResult;
  }

  const fieldName = fieldNames[0];
  const allKeysSame = _.every(rule, (value) => {
    return _.isEqual(Object.keys(value), fieldNames);
  });

  if (!allKeysSame) {
    return defaultResult;
  }

  if (!_.isEqual(existsClause[fieldName], {$exists: false}) ||
    !_.isEqual(nullClause[fieldName], null)) {
    return defaultResult;
  }

  return {
    field: fieldName,
    value: wrappedClause[fieldName],
    nullable: true
  };
}

/**
 * [hasMultipleNullables counts the number of rules with nullable === true]
 * @param  {[type]}  rules [lots of rules] @todo make this better!
 * @return {Boolean}       [description]
 */
function hasMultipleNullables(rules) {
  console.log('at has multiple nullables');
  const nullableCount = rules.reduce(function(n, rule) {
    console.log(rule.nullable);
    return n + (rule.nullable === true);
  }, 0);

  console.log('nullableCount: ' + nullableCount);
  if (nullableCount > 1) {
    return true;
  }
  return false;
}

module.exports = {
  nullableOrQueryWrapper: nullableOrQueryWrapper,
  nullableOrValidator: nullableOrValidator,
  hasMultipleNullables: hasMultipleNullables
};
