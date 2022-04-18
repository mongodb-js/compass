/**
 * Create name action.
 */
export const CHANGE_NAME = 'indexes/create-index/name/CHANGE_NAME';

/**
 * The initial state of the index name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create index name.
 *
 * @param {String} state - The create index name state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_NAME) {
    return action.name;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param {String} name - The name.
 *
 * @returns {Object} The action.
 */
export const changeName = (name) => ({
  type: CHANGE_NAME,
  name: name,
});
