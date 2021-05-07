import queryParser from 'mongodb-query-parser';

/**
 * Format the provided attribute into a pretty-printed version
 * of what would appear in the query bar.
 *
 * @param {Object} value - The value to format.
 * @returns {Object}
 */
const formatQuery = (value) => queryParser.toJSString(value);

export default formatQuery;
export { formatQuery };
