import { toJSString } from 'mongodb-query-parser';

/**
 * Format the provided attribute into a pretty-printed version
 * of what would appear in the query bar.
 */
const formatQuery = (value: unknown): string => toJSString(value) || '';

export { formatQuery };
