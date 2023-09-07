/**
 * The readonly view changed action name.
 */
export const READONLY_VIEW_CHANGED =
  'indexes/is-readonly-view/READONLY_VIEW_CHANGED';

/**
 * The initial state of the is readonly view attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for is readonly view state.
 *
 * @param {Boolean} state - The state.
 *
 * @returns {Boolean} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === READONLY_VIEW_CHANGED) {
    return action.isReadonlyView;
  }
  return state;
}

/**
 * Action creator for readonly view changed events.
 *
 * @param {Boolean} isReadonlyView - Is the view readonly.
 *
 * @returns {import('redux').AnyAction} The readonly view changed action.
 */
export const readonlyViewChanged = (isReadonlyView) => ({
  type: READONLY_VIEW_CHANGED,
  isReadonlyView: isReadonlyView,
});
