export const SET_VIEW_SOURCE = 'aggregations/create-view/source/SET';

export const INITIAL_STATE = '';

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_VIEW_SOURCE) {
    return action.source;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param {String} source - The view source namespace.
 *
 * @returns {Object} The action.
 */
export const setViewSource = (source) => ({
  type: SET_VIEW_SOURCE,
  source: source
});
