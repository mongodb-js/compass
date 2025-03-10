import type { AnyAction } from 'redux';
import type { RootAction } from '.';
import {
  SET_VALIDATION_TO_DEFAULT,
  type SetValidationToDefaultAction,
} from './validation';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

/**
 * The edit mode changed action.
 */
export const EDIT_MODE_CHANGED =
  'validation/edit-mode/EDIT_MODE_CHANGED' as const;
export const ENABLE_EDIT_RULES =
  'validation/edit-mode/ENABLE_EDIT_RULES' as const;
export const DISABLE_EDIT_RULES =
  'validation/edit-mode/DISABLE_EDIT_RULES' as const;

type EditModeChangedAction = {
  type: typeof EDIT_MODE_CHANGED;
  editMode: Partial<EditModeState>;
};

type EnableEditRulesAction = {
  type: typeof ENABLE_EDIT_RULES;
};

type DisableModeChangedAction = {
  type: typeof DISABLE_EDIT_RULES;
};

export type EditModeAction =
  | EditModeChangedAction
  | EnableEditRulesAction
  | DisableModeChangedAction;

export interface EditModeState {
  collectionReadOnly: boolean;
  collectionTimeSeries: boolean;
  writeStateStoreReadOnly: boolean;
  oldServerReadOnly: boolean;
  isEditingEnabledByUser: boolean;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: EditModeState = {
  collectionReadOnly: false,
  collectionTimeSeries: false,
  writeStateStoreReadOnly: false,
  oldServerReadOnly: false,
  isEditingEnabledByUser: false,
};

/**
 * Reducer function for handle state changes to namespace.
 *
 * @param {String} state - The namespace state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state: EditModeState = INITIAL_STATE,
  action: RootAction
): EditModeState {
  if (action.type === EDIT_MODE_CHANGED) {
    return { ...state, ...action.editMode };
  }

  if (action.type === ENABLE_EDIT_RULES) {
    return { ...state, isEditingEnabledByUser: true };
  }

  if (action.type === DISABLE_EDIT_RULES) {
    return { ...state, isEditingEnabledByUser: false };
  }

  if (
    isAction<SetValidationToDefaultAction>(action, SET_VALIDATION_TO_DEFAULT)
  ) {
    return { ...state, isEditingEnabledByUser: true };
  }

  return state;
}

/**
 * Action creator for the edit mode changed events.
 *
 * @param {Object} editMode - The edit mode.
 *
 * @returns {Object} The edit mode changed action.
 */
export const editModeChanged = (
  editMode: Partial<EditModeState>
): EditModeChangedAction => ({
  type: EDIT_MODE_CHANGED,
  editMode,
});

export const enableEditRules = (): EnableEditRulesAction => ({
  type: ENABLE_EDIT_RULES,
});

export const disableEditRules = (): DisableModeChangedAction => ({
  type: DISABLE_EDIT_RULES,
});
