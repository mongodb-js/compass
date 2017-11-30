import { STAGE_CHANGED } from 'action-creators';

/**
 * The initial state.
 */
const INITIAL_STATE = [
  {
    stage: '',
    isValid: true,
    isEnabled: true
  }
];

/**
 * Reducer function for handle state changes to stages.
 *
 * @param {Array} state - The stages state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
const stages = (state = INITIAL_STATE, action) => {
  if (action.type === STAGE_CHANGED) {
    const newState = state.map(s => Object.assign({}, s));
    newState[action.index].stage = action.stage;
    return newState;
  }
  return state;
};

export default stages;
