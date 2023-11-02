import type { Document } from 'bson';
import { BSON } from 'bson';
import { isEqual } from 'lodash';
import type { AnyAction } from 'redux';

export { copyToClipboard } from './copy-to-clipboard';
export { formatQuery } from './format-query';
export { getQueryAttributes } from './get-query-attributes';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

/**
 * Same as _.isEqual, except it takes key order into account
 */
export function isQueryEqual(value: Document, other: Document): boolean {
  return isEqual(BSON.serialize(value), BSON.serialize(other));
}
