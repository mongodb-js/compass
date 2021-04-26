import { ON_PREM } from 'mongodb-ace-autocompleter';

/**
 * Env changed action.
 */
export const ENV_CHANGED = 'aggregations/env/ENV_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = ON_PREM;

/**
 * Reducer function for handle state changes to env.
 *
 * @param {String} state - The env state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === ENV_CHANGED) {
    return action.env;
  }
  return state;
}

/**
 * Action creator for env changed events.
 *
 * @param {String} env - The env value.
 *
 * @returns {Object} The env changed action.
 */
export const envChanged = (env) => ({
  type: ENV_CHANGED,
  env: env
});
