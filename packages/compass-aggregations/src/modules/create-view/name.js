export const CHANGE_VIEW_NAME = 'aggregations/create-view/name/CHANGE_NAME';

export const INITIAL_STATE = '';

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_VIEW_NAME) {
    return action.name;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param {String} name - The view name.
 *
 * @returns {Object} The action.
 */
export const changeViewName = (name) => ({
  type: CHANGE_VIEW_NAME,
  name: name
});
