import type { CollationOptions } from 'mongodb';
import { parse, ParseMode } from '@mongodb-js/shell-bson-parser';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';
import { isObject } from 'lodash';
import type { PipelineBuilderThunkAction } from '.';

/**
 * Collation string changed action.
 */
const COLLATION_STRING_CHANGED =
  'aggregations/collation/COLLATION_STRING_CHANGED' as const;
const COLLATION_STRING_PARSED =
  'aggregations/collation/COLLATION_STRING_PARSED' as const;

type CollationStringChangedAction = {
  type: typeof COLLATION_STRING_CHANGED;
  collationString: string;
};

type CollationStringParsedAction = {
  type: typeof COLLATION_STRING_PARSED;
  collationState: CollationStringState;
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
  isValid: true,
};

export async function getCollationStateFromString(
  collationString: string
): Promise<CollationStringState> {
  if (collationString.trim() === '') {
    return {
      text: collationString,
      value: null,
      isValid: true,
    };
  }

  try {
    const collation = await parse(collationString, {
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
    return {
      ...state,
      text: action.collationString,
    };
  }
  if (isAction<CollationStringParsedAction>(action, COLLATION_STRING_PARSED)) {
    return action.collationState;
  }
  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return { ...INITIAL_STATE };
  }
  return state;
}

/**
 * Action creator for collation string changed event.
 */
export const collationStringChanged = (
  value: string
): PipelineBuilderThunkAction<
  Promise<void>,
  CollationStringChangedAction | CollationStringParsedAction
> => {
  return async (dispatch, getState) => {
    dispatch({
      type: COLLATION_STRING_CHANGED,
      collationString: value,
    });
    const collationState = await getCollationStateFromString(value);
    if (getState().collationString.text !== value) {
      return;
    }
    dispatch({ type: COLLATION_STRING_PARSED, collationState });
  };
};
