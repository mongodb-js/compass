export const IS_LOADED_CHANGED = 'validation/namespace/IS_LOADED_CHANGED';

export const INITIAL_STATE = false;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === IS_LOADED_CHANGED) {
    return action.isLoaded;
  }

  return state;
}

export const isLoadedChanged = (isLoaded) => ({
  type: IS_LOADED_CHANGED,
  isLoaded,
});
