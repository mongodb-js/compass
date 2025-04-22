import type { AnyAction } from 'redux';
import type { DataModelingActions, DataModelingActionTypes } from './reducer';

export function isAction<T extends DataModelingActionTypes>(
  action: AnyAction,
  type: T
): action is Extract<DataModelingActions, { type: T }> {
  return action.type === type;
}
