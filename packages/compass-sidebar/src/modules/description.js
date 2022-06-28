/**
 * The module action prefix.
 */
const PREFIX = 'sidebar';

/**
 * The changeDescription action type.
 */
export const CHANGE_DESCRIPTION = `${PREFIX}/description/CHANGE_DESCRIPTION`;

/**
 * The initial state.
 */
export const INITIAL_STATE = 'Topology type not yet discovered.';

/**
 * Reducer function for handle state changes to changeDescription.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === CHANGE_DESCRIPTION) {
    return action.description;
  }
  return state;
};

export default reducer;

/**
 * Action creator for changeDescription events.
 *
 * @param {String} description - The description.
 * @returns {Object} The changeDescription action.
 */
export const changeDescription = (description) => ({
  type: CHANGE_DESCRIPTION,
  description: description
});
