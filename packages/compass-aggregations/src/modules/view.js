/**
 * View changed action.
 */
export const VIEW_CHANGED = 'aggregations/view/VIEW_CHANGED';

/**
 * The code view.
 */
export const CODE = 'Code';

/**
 * The builder view.
 */
export const BUILDER = 'Builder';

/**
 * The initial state.
 */
export const INITIAL_STATE = CODE;

/**
 * Reducer function for handle state changes to the view.
 *
 * @param {String} state - The view state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === VIEW_CHANGED) {
    return action.view;
  }
  return state;
}

/**
 * Action creator for view changed events.
 *
 * @param {String} view - The view value.
 *
 * @returns {Object} The view changed action.
 */
export const viewChanged = (view) => ({
  type: VIEW_CHANGED,
  view: view
});
