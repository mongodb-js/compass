import { createStore } from 'redux';
import { STAGE_CHANGED } from 'constants/actions';

/**
 * The initial state of the store.
 */
const INITIAL_STATE = {
  stages: [],
  isValid: true
};

/**
 * Modify the pipeline being worked on.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const pipeline = (state = INITIAL_STATE, action) => {
  if (action.type === STAGE_CHANGED) {
    const newState = Object.assign({}, state);
    newState.stages[action.index] = action.stage;
    return newState;
  }
  return state;
};

/**
 * The store has a pipeline reducer.
 */
const store = createStore(pipeline);

export default store;
export { store };
