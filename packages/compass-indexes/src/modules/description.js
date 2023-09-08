/**
 * The module action prefix.
 */
const PREFIX = 'indexes';

/**
 * The getDescription action type.
 */
export const GET_DESCRIPTION = `${PREFIX}/description/GET_DESCRIPTION`;

/**
 * The initial state.
 */
export const INITIAL_STATE = 'Topology type not yet discovered.';

/**
 * Reducer function for handle state changes to getDescription.
 *
 * @param {Boolean} state - The status state.
 * @param {String} action - The action.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === GET_DESCRIPTION) {
    return action.description;
  }
  return state;
};

export default reducer;

/**
 * Action creator for getDescription events.
 *
 * @param {String} description - The description.
 * @returns {import('redux').AnyAction} The getDescription action.
 */
export const getDescription = (description) => ({
  type: GET_DESCRIPTION,
  description: description,
});
