/**
 * Stage added action name.
 */
const STAGE_ADDED = 'aggregations/stages/STAGE_ADDED';

/**
 * Stage changed action name.
 */
const STAGE_CHANGED = 'aggregations/stages/STAGE_CHANGED';

/**
 * An initial stage.
 */
const EMPTY_STAGE = {
  stage: '',
  isValid: true,
  isEnabled: true
};

/**
 * The initial state.
 */
const INITIAL_STATE = [ EMPTY_STAGE ];

/**
 * Copy the state.
 *
 * @param {Array} state - The current state.
 *
 * @returns {Array} The copied state.
 */
const copyState = (state) => (state.map(s => Object.assign({}, s)));

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
    const newState = copyState(state);
    newState[action.index].stage = action.stage;
    return newState;
  } else if (action.type === STAGE_ADDED) {
    const newState = copyState(state);
    newState.push(EMPTY_STAGE);
    return newState;
  }
  return state;
};

/**
 * Action creator for adding a stage.
 *
 * @returns {Object} the stage added action.
 */
const stageAdded = () => ({
  type: STAGE_ADDED
});

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
export { stageAdded, stageChanged, STAGE_ADDED, STAGE_CHANGED };
