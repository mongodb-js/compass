import type { AnyAction } from 'redux';
import {
  STAGE_DISABLED_CHANGE,
  STAGE_MOVED,
  STAGE_OPERATOR_CHANGE,
  STAGE_ADDED,
  STAGE_REMOVED,
  STAGE_VALUE_CHANGE
} from './pipeline-builder/stage-editor';
import { SAVED_PIPELINE_ADD } from './saved-pipeline';

/**
 * Set is modified action.
 */
export const SET_IS_MODIFIED = 'aggregations/is-modified/SET_IS_MODIFIED';

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isModified.
 *
 * @param {Boolean} state - The isModified state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (
    [
      STAGE_VALUE_CHANGE,
      STAGE_OPERATOR_CHANGE,
      STAGE_DISABLED_CHANGE,
      STAGE_ADDED,
      STAGE_REMOVED,
      STAGE_MOVED
    ].includes(action.type as string)
  ) {
    return true;
  }

  if ([SAVED_PIPELINE_ADD].includes(action.type as string)) {
    return false;
  }

  return state;
}
