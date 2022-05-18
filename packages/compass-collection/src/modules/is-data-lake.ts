import type { AnyAction } from 'redux';

/**
 * The prefix.
 */
const PREFIX = 'collection';

/**
 * Is data lake changed.
 */
export const IS_DATA_LAKE_CHANGED = `${PREFIX}/is-data-lake/IS_DATA_LAKE_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is data lake.
 *
 * @param {String} state - The is data lake state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): boolean {
  if (action.type === IS_DATA_LAKE_CHANGED) {
    return action.isDataLake;
  }
  return state;
}

export const dataLakeChanged = (isDataLake: boolean): AnyAction => ({
  type: IS_DATA_LAKE_CHANGED,
  isDataLake,
});