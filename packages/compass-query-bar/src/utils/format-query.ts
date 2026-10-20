import { prettify } from '@mongodb-js/compass-editor';
import type { QueryAttributes } from './get-query-attributes';

/**
 * Combine the saved query strings into a single pretty-printed query object.
 */
const formatQuery = (query: QueryAttributes): string => {
  // Values can end with a line comment, so separators go on the next line.
  const source = `{\n${Object.entries(query)
    .map(([key, value]) => `${key}: ${value}\n`)
    .join(',')}}`;
  try {
    return prettify(source);
  } catch {
    return source;
  }
};

export { formatQuery };
