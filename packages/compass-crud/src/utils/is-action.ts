import type { AnyAction } from 'redux';
import type { CrudActionTypes, CrudReduxActions } from '../stores/reducer';

export function isAction<T extends CrudActionTypes>(
  action: AnyAction,
  type: T
): action is Extract<CrudReduxActions, { type: T }> {
  return action.type === type;
}
