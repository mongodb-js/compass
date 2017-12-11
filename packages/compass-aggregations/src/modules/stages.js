/**
 * Stage changed action.
 */
const STAGE_CHANGED = 'STAGE_CHANGED';

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
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === STAGE_CHANGED) {
    const newState = state.map(s => Object.assign({}, s));
    newState[action.index].stage = action.stage;
    return newState;
  }
  return state;
};

/**
 * Action creator for stage changed events.
 *
 * @param {String} value - The stage text value.
 * @param {Number} index - The index of the stage.
 *
 * @returns {Object} The stage changed action.
 */
const stageChanged = (value, index) => ({
  type: STAGE_CHANGED,
  index: index,
  stage: value
});

export default reducer;
export { stageChanged, STAGE_CHANGED };
