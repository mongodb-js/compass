import type { CollationOptions } from 'mongodb';
import queryParser from 'mongodb-query-parser';
import type { AnyAction } from 'redux';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { RESTORE_PIPELINE } from './saved-pipeline';

/**
 * Collation string changed action.
 */
export const COLLATION_STRING_CHANGED =
  'aggregations/collation/COLLATION_STRING_CHANGED';

export type CollationStringChangedAction = {
  type: typeof COLLATION_STRING_CHANGED;
  value: string;
};

export type CollationStringState = {
  text: string;
  value: CollationOptions | null;
  isValid: boolean;
};

/**
 * The collation string initial state.
 */
export const INITIAL_STATE: CollationStringState = {
  text: '',
  value: null,
  isValid: true
};

export function getCollationStateFromString(
  collationString: string
): CollationStringState {
  const collation = queryParser.isCollationValid(collationString);
  return {
    text: collationString,
    value: collation === false ? null : collation,
    isValid: collation !== false
  };
}

/**
 * Reducer function for handle collation string state changes.
 */
export default function reducer(
  state: CollationStringState = INITIAL_STATE,
  action: AnyAction
): CollationStringState {
  if (action.type === COLLATION_STRING_CHANGED) {
    return getCollationStateFromString(action.value as string);
  }
  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
    return { ...INITIAL_STATE };
  }
  if (action.type === RESTORE_PIPELINE) {
    return getCollationStateFromString(action.restoreState.collationString as string);
  }
  return state;
}

/**
 * Action creator for collation string changed event.
 */
export const collationStringChanged = (
  value: string
): CollationStringChangedAction => {
  return { type: COLLATION_STRING_CHANGED, value };
};
