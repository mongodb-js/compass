import type { AnyAction } from 'redux';

export const INITIAL_STATE = false;

export const isAtlasChanged = (isAtlas: boolean) => ({
  type: 'IS_ATLAS_CHANGED',
  isAtlas: isAtlas,
});

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === 'IS_ATLAS_CHANGED') {
    return action.isAtlas;
  }

  return state;
}
