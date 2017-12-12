/**
 * Action name prefix.
 */
const PREFIX = 'aggregations/stages';

/**
 * Stage added action name.
 */
const STAGE_ADDED = `${PREFIX}/STAGE_ADDED`;

/**
 * Stage changed action name.
 */
const STAGE_CHANGED = `${PREFIX}/STAGE_CHANGED`;

/**
 * Stage collapse toggled action name.
 */
const STAGE_COLLAPSE_TOGGLED = `${PREFIX}/STAGE_COLLAPSE_TOGGLED`;

/**
 * Stage deleted action name.
 */
const STAGE_DELETED = `${PREFIX}/STAGE_DELETED`;

/**
 * Stage toggled action name.
 */
const STAGE_TOGGLED = `${PREFIX}/STAGE_TOGGLED`;

/**
 * An initial stage.
 */
const EMPTY_STAGE = {
  stage: '',
  isValid: true,
  isEnabled: true,
  isExpanded: true
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
  } else if (action.type === STAGE_DELETED) {
    const newState = copyState(state);
    newState.splice(action.index, 1);
    return newState;
  } else if (action.type === STAGE_TOGGLED) {
    const newState = copyState(state);
    newState[action.index].isEnabled = !newState[action.index].isEnabled;
    return newState;
  } else if (action.type === STAGE_COLLAPSE_TOGGLED) {
    const newState = copyState(state);
    newState[action.index].isExpanded = !newState[action.index].isExpanded;
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

/**
 * Action creator for toggling whether the stage is collapsed.
 *
 * @param {Number} index - The index of the stage.
 *
 * @returns {Object} The stage collapse toggled action.
 */
const stageCollapseToggled = (index) => ({
  type: STAGE_COLLAPSE_TOGGLED,
  index: index
});

/**
 * Action creator for stage deleted events.
 *
 * @param {Number} index - The index of the stage.
 *
 * @returns {Object} The stage deleted action.
 */
const stageDeleted = (index) => ({
  type: STAGE_DELETED,
  index: index
});

/**
 * Handles toggling a stage on/off.
 *
 * @param {Number} index - The stage index.
 *
 * @returns {Object} The stage toggled action.
 */
const stageToggled = (index) => ({
  type: STAGE_TOGGLED,
  index: index
});

export default reducer;
export {
  stageAdded,
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageToggled,
  STAGE_ADDED,
  STAGE_CHANGED,
  STAGE_COLLAPSE_TOGGLED,
  STAGE_DELETED,
  STAGE_TOGGLED
};
