import type { AnyAction } from 'redux';
import type { DocsChatbotActions, DocsChatbotActionTypes } from './reducer';

export function isAction<T extends DocsChatbotActionTypes>(
  action: AnyAction,
  type: T
): action is Extract<DocsChatbotActions, { type: T }> {
  return action.type === type;
}
