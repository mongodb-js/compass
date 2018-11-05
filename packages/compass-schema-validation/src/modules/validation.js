/**
 * The module action prefix.
 */
const PREFIX = 'validation';

/**
 * Validation rules changed action name.
 */
export const VALIDATION_RULES_CHANGED = `${PREFIX}/VALIDATION_RULES_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  validationRules: '',
  syntaxError: null,
  error: null
};

/**
 * Change stage value.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeValidationRules = (state, action) => {
  const newState = {...state};

  newState.validationRules = action.validationRules;

  return newState;
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {};

MAPPINGS[VALIDATION_RULES_CHANGED] = changeValidationRules;

/**
 * Reducer function for handle state changes to status.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

/**
 * Action creator for validation rules changed events.
 *
 * @param {String} value - Validation rules.
 *
 * @returns {Object} Validation rules changed action.
 */
export const validationRulesChanged = (validationRules) => ({
  type: VALIDATION_RULES_CHANGED,
  validationRules
});
