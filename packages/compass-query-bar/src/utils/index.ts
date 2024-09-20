import type { Document } from 'bson';
import { BSON } from 'bson';
import { isEqual } from 'lodash';

export { copyToClipboard } from './copy-to-clipboard';
export { formatQuery } from './format-query';
export { getQueryAttributes } from './get-query-attributes';

/**
 * Same as _.isEqual, except it takes key order into account
 */
export function isQueryEqual(value: Document, other: Document): boolean {
  return (
    value === other || isEqual(BSON.serialize(value), BSON.serialize(other))
  );
}
