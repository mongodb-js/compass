export const IS_LOADED_CHANGED = 'validation/namespace/IS_LOADED_CHANGED';

export const INITIAL_STATE = {
  collectionReadOnly: false,
  hadronReadOnly: false,
  writeStateStoreReadOnly: false,
  oldServerReadOnly: false
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === IS_LOADED_CHANGED) {
    return { ...state, ...action.isLoaded };
  }

  return state;
}

export const isLoadedChanged = (isLoaded) => ({
  type: IS_LOADED_CHANGED,
  isLoaded
});
