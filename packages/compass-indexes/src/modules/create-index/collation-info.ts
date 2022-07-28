import type { CollationOptions } from 'mongodb';
import type { AnyAction } from 'redux';
import queryParser from 'mongodb-query-parser';

/**
 * Collation info changed action.
 */
export const COLLATION_INFO_CHANGED =
  'aggregations/collation/COLLATION_INFO_CHANGED';

export type CollationInfoState = {
  text: string;
  value: CollationOptions | null;
  isValid: boolean;
};

/**
 * The collation info initial state.
 */
export const INITIAL_STATE: CollationInfoState = {
  text: '',
  value: null,
  isValid: true,
};

export function getCollationStateFromString(
  collationInfo: string
): CollationInfoState {
  const collation = queryParser.isCollationValid(collationInfo);
  return {
    text: collationInfo,
    value: collation === false ? null : collation,
    isValid: collation !== false,
  };
}

/**
 * Reducer function for handle collation info state changes.
 */
export default function reducer(
  state: CollationInfoState = INITIAL_STATE,
  action: AnyAction
): CollationInfoState {
  if (action.type === COLLATION_INFO_CHANGED) {
    return getCollationStateFromString(action.value);
  }
  return state;
}

/**
 * Action creator for collation info changed event.
 */
export const collationInfoChanged = (value: string): AnyAction => {
  return { type: COLLATION_INFO_CHANGED, value };
};
