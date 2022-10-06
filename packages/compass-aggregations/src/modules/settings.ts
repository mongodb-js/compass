import type { AnyAction, Reducer } from 'redux';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import type { ThunkAction } from 'redux-thunk';

import type { RootState } from '.';

const PREFIX = 'aggregations/settings';

export const TOGGLE_IS_EXPANDED = `${PREFIX}/TOGGLE_IS_EXPANDED`;

export const TOGGLE_COMMENT_MODE = `${PREFIX}/TOGGLE_COMMENT_MODE`;

export const SET_SAMPLE_SIZE = `${PREFIX}/SET_SAMPLE_SIZE`;

export const SET_LIMIT = `${PREFIX}/SET_LIMIT`;

export const APPLY_SETTINGS = `${PREFIX}/APPLY_SETTINGS`;

import {
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_LARGE_LIMIT
} from '../constants';

type State = {
  isExpanded: boolean,
  isCommentMode: boolean,
  isDirty: boolean,
  sampleSize: number,
  limit: number
};

export const INITIAL_STATE: State = {
  isExpanded: false,
  isCommentMode: true,
  isDirty: false,
  sampleSize: DEFAULT_SAMPLE_SIZE, // limit
  limit: DEFAULT_LARGE_LIMIT // largeLimit
};

const reducer: Reducer<State, AnyAction> = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_IS_EXPANDED) {
    const isCollapsing = !state.isExpanded === false;
    if (isCollapsing && state.isDirty === true) {
      return {
        ...state,
        ...INITIAL_STATE
      };
    }
    return {
      ...state,
      isExpanded: !state.isExpanded
    };
  }

  if (action.type === TOGGLE_COMMENT_MODE) {
    return {
      ...state,
      isCommentMode: !state.isCommentMode,
      isDirty: true
    };
  }

  if (action.type === SET_SAMPLE_SIZE) {
    return {
      ...state,
      sampleSize: action.value,
      isDirty: true
    };
  }

  if (action.type === SET_LIMIT) {
    return {
      ...state,
      limit: action.value,
      isDirty: true
    };
  }

  if (action.type === APPLY_SETTINGS) {
    return { ...state, isDirty: false };
  }
  return state;
}

export const toggleSettingsIsExpanded = () => ({
  type: TOGGLE_IS_EXPANDED
});

export const toggleSettingsIsCommentMode = () => ({
  type: TOGGLE_COMMENT_MODE
});

export const setSettingsSampleSize = (value: number) => ({
  type: SET_SAMPLE_SIZE,
  value: value
});

export const setSettingsLimit = (value: number) => ({
  type: SET_LIMIT,
  value: value
});

const doApplySettings = (settings: State) => ({
  type: APPLY_SETTINGS,
  settings,
});

export const applySettings = (): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch, getState) => {
    const { settings } = getState();
    dispatch(doApplySettings(settings));
    dispatch(
      globalAppRegistryEmit('compass:aggregations:settings-applied', {
        settings
      })
    );
  };
};

export default reducer;
