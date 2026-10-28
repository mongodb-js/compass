import type { CollationOptions } from 'mongodb';
import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';
import type { AnyAction } from 'redux';
import { isObject } from 'lodash';
import { isAction } from '../utils/is-action';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type { RestorePipelineAction } from './saved-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';

/**
 * Collation string changed action.
 */
export const COLLATION_STRING_CHANGED =
  'aggregations/collation/COLLATION_STRING_CHANGED' as const;

export type CollationStringChangedAction = {
  type: typeof COLLATION_STRING_CHANGED;
  value: string;
};

export type CollationStringAction = CollationStringChangedAction;

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
  isValid: true,
};

export function getCollationStateFromString(
  collationString: string
): CollationStringState {
  if (collationString.trim() === '') {
    return {
      text: collationString,
      value: null,
      isValid: true,
    };
  }

  try {
    const collation = parse(collationString, {
      mode: ParseMode.Loose,
    });
    const isValid = isObject(collation) && !Array.isArray(collation);
    return {
      text: collationString,
      value: isValid ? (collation as CollationOptions) : null,
      isValid,
    };
  } catch {
    return {
      text: collationString,
      value: null,
      isValid: false,
    };
  }
}

/**
 * Reducer function for handle collation string state changes.
 */
export default function reducer(
  state: CollationStringState = INITIAL_STATE,
  action: AnyAction
): CollationStringState {
  if (
    isAction<CollationStringChangedAction>(action, COLLATION_STRING_CHANGED)
  ) {
    return getCollationStateFromString(action.value);
  }
  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return { ...INITIAL_STATE };
  }
  if (isAction<RestorePipelineAction>(action, RESTORE_PIPELINE)) {
    if (action.storedOptions.collationString) {
      return getCollationStateFromString(action.storedOptions.collationString);
    }
    return state;
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
