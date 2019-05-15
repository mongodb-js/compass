import Reflux from 'reflux';

const configureActions = () => {
  const actions = Reflux.createActions([
  /**
     * toggles or sets the expanded query options open or closed.
     */
    'toggleQueryOptions': {sync: true},
    /**
     * toggles or sets sample true/false
     */
    'toggleSample': {sync: true},
    /**
     * Sets the entire query, overwriting all fields.
     */
    'setQuery': {sync: true},
    /**
     * Sets the entire query as string, overwriting all fields.
     */
    'setQueryString': {sync: true},
    /**
     * Sets the entire query as string, overwriting all fields, and detects
     * if the user is still typing. Useful for text input.
     */
    'typeQueryString': {sync: true},
    /**
     * Sets the value for a specific field, overwriting all previous values.
     */
    'setValue': {sync: true},
    /**
     * Clears the value of a specific field.
     */
    'clearValue': {sync: true},

    /* Distinct actions:
     * support single values (equality clause) and multiple values ($in clause).
     */

    /**
     * Adds a value to a distinct set of values for a field.
     */
    'addDistinctValue': {sync: true},
    /**
     * Removes a value from a distinct set of values for a field.
     */
    'removeDistinctValue': {sync: true},
    /**
     * Toggles a value in a distinct set of values for a field.
     */
    'toggleDistinctValue': {sync: true},
    /**
     * Sets all distinct values of a field at once. If a single value is specified
     * and the value is already set, remove the value.
     */
    'setDistinctValues': {sync: true},

    /* Range actions:
     * support single values (equality clause) and ranges ($gt(e) / $lt(e) clauses).
     */

    /**
     * Sets a range of values, specifying min and max values and inclusive/exclusive
     * upper and lower bounds.
     */
    'setRangeValues': {sync: true},

    /* Geo actions */

    /**
     *  sets a $geoWithin query with center and distance.
     */
    'setGeoWithinValue': {sync: true},

    /* Execution */

    /**
     * apply the current query, only possible if the query is valid. Also stores
     * the current query as `lastExecutedQuery`.
     */
    'apply': {sync: true},
    /**
     * return to the last executed query, dismissing all changes.
     */
    'reset': {sync: true},

    /**
     * Export to language/query history.
     */
    'exportToLanguage': { sync: true },
    'toggleQueryHistory': { sync: true },
    'refreshEditor': { sync: true }
  ]);

  return actions;
};

export default configureActions;
