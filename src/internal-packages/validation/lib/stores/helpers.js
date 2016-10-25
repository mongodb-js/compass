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

module.exports = {
  nullableOrQueryWrapper: nullableOrQueryWrapper
};
