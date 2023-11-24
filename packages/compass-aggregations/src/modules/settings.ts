import type { Reducer } from 'redux';
import type { PipelineBuilderThunkAction, RootAction } from '.';

import { DEFAULT_SAMPLE_SIZE, DEFAULT_LARGE_LIMIT } from '../constants';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { updatePipelinePreview } from './pipeline-builder/builder-helpers';

const PREFIX = 'aggregations/settings' as const;

export const TOGGLE_IS_EXPANDED = `${PREFIX}/TOGGLE_IS_EXPANDED` as const;
interface ToggleIsExpandedAction {
  type: typeof TOGGLE_IS_EXPANDED;
}

export const TOGGLE_COMMENT_MODE = `${PREFIX}/TOGGLE_COMMENT_MODE` as const;
interface ToggleCommentModeAction {
  type: typeof TOGGLE_COMMENT_MODE;
}

export const SET_SAMPLE_SIZE = `${PREFIX}/SET_SAMPLE_SIZE` as const;
interface SetSampleSizeAction {
  type: typeof SET_SAMPLE_SIZE;
  value: number;
}

export const SET_LIMIT = `${PREFIX}/SET_LIMIT` as const;
interface SetLimitAction {
  type: typeof SET_LIMIT;
  value: number;
}

export const APPLY_SETTINGS = `${PREFIX}/APPLY_SETTINGS` as const;
interface ApplySettingsAction {
  type: typeof APPLY_SETTINGS;
  settings: SettingsState;
}
export type SettingsAction =
  | ToggleIsExpandedAction
  | ToggleCommentModeAction
  | SetSampleSizeAction
  | SetLimitAction
  | ApplySettingsAction;

export type SettingsState = {
  isExpanded: boolean;
  isCommentMode: boolean;
  isDirty: boolean;
  sampleSize: number;
  limit: number;
};

export const INITIAL_STATE: SettingsState = {
  isExpanded: false,
  isCommentMode: true,
  isDirty: false,
  sampleSize: DEFAULT_SAMPLE_SIZE, // limit
  limit: DEFAULT_LARGE_LIMIT, // largeLimit
};

const reducer: Reducer<SettingsState, RootAction> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === TOGGLE_IS_EXPANDED) {
    const isCollapsing = !state.isExpanded === false;
    if (isCollapsing && state.isDirty === true) {
      return { ...INITIAL_STATE };
    }
    return {
      ...state,
      isExpanded: !state.isExpanded,
    };
  }

  if (action.type === TOGGLE_COMMENT_MODE) {
    return {
      ...state,
      isCommentMode: !state.isCommentMode,
      isDirty: true,
    };
  }

  if (action.type === SET_SAMPLE_SIZE) {
    return {
      ...state,
      sampleSize: action.value,
      isDirty: true,
    };
  }

  if (action.type === SET_LIMIT) {
    return {
      ...state,
      limit: action.value,
      isDirty: true,
    };
  }

  if (action.type === APPLY_SETTINGS) {
    return { ...state, isDirty: false };
  }

  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
    return { ...INITIAL_STATE };
  }

  return state;
};

export const toggleSettingsIsExpanded = (): ToggleIsExpandedAction => ({
  type: TOGGLE_IS_EXPANDED,
});

export const toggleSettingsIsCommentMode = (): ToggleCommentModeAction => ({
  type: TOGGLE_COMMENT_MODE,
});

export const setSettingsSampleSize = (value: number): SetSampleSizeAction => ({
  type: SET_SAMPLE_SIZE,
  value: value,
});

export const setSettingsLimit = (value: number): SetLimitAction => ({
  type: SET_LIMIT,
  value: value,
});

const doApplySettings = (settings: SettingsState): ApplySettingsAction => ({
  type: APPLY_SETTINGS,
  settings,
});

export const applySettings = (): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const { settings } = getState();
    dispatch(doApplySettings(settings));
    dispatch(updatePipelinePreview());
  };
};

export default reducer;
