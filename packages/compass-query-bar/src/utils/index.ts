import { isEqual, isEqualWith, isObject } from 'lodash';
import type { AnyAction } from 'redux';

export { copyToClipboard } from './copy-to-clipboard';
export { formatQuery } from './format-query';
export { getQueryAttributes } from './get-query-attributes';
export * from './query-storage';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

/**
 * Same as _.isEqual, except it takes key order into account
 */
export function isQueryEqual(value: any, other: any): boolean {
  return isEqualWith(value, other, (a: any, b: any) => {
    if (isObject(a) && isObject(b)) {
      if (!isEqual(Object.keys(a), Object.keys(b))) {
        return false;
      }
    }
    // return undefined to fallback to the default isEqual behavior
    return undefined;
  });
}
