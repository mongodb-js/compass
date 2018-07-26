/**
 * The module action prefix.
 */
const PREFIX = 'compassFindInPage';

export const TOGGLE_STATUS = `${PREFIX}/TOGGLE_STATUS`;
export const FIND = `${PREFIX}/FIND`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  enabled: false,
  searchTerm: ''
};

/**
 * Reducer function for handle state changes to status.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_STATUS) {
    state.enabled = (state.enabled === true) ? false : true;
    console.log('NEW STATE', state);
    return state;
  }
  if (action.type === FIND) return {... state, searchTerm: action.searchTerm};

  return state;
}

/**
 * Action creator for toggle status events.
 *
 * @returns {Object} The toggle status action.
 */
export const toggleStatus = () => ({
  type: TOGGLE_STATUS
});

export const find = (searchTerm) => ({
  type: FIND,
  searchTerm: searchTerm
});
