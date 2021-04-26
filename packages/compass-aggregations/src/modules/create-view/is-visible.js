export const TOGGLE_IS_VISIBLE =
  'aggregations/create-view/is-visible/TOGGLE_IS_VISIBLE';

export const INITIAL_STATE = false;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_VISIBLE) {
    return action.isVisible;
  }
  return state;
}
export const toggleIsVisible = (isVisible) => ({
  type: TOGGLE_IS_VISIBLE,
  isVisible: isVisible
});
