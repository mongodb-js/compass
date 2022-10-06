import type { CollationOptions } from 'mongodb';
import queryParser from 'mongodb-query-parser';
import { CONFIRM_NEW } from './import-pipeline';

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
  action: CollationStringChangedAction
): CollationStringState {
  if (action.type === COLLATION_STRING_CHANGED) {
    return getCollationStateFromString(action.value);
  }
  if (action.type === CONFIRM_NEW) {
    return { ...INITIAL_STATE };
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
