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
