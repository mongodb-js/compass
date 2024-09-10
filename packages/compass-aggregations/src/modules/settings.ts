import type { Action, Reducer } from 'redux';
import type { PipelineBuilderThunkAction } from '.';

import { DEFAULT_SAMPLE_SIZE, DEFAULT_LARGE_LIMIT } from '../constants';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { updatePipelinePreview } from './pipeline-builder/builder-helpers';
import { isAction } from '../utils/is-action';

const PREFIX = 'aggregations/settings' as const;

export const TOGGLE_IS_EXPANDED = `${PREFIX}/TOGGLE_IS_EXPANDED` as const;
export interface ToggleIsExpandedAction {
  type: typeof TOGGLE_IS_EXPANDED;
}

export const TOGGLE_COMMENT_MODE = `${PREFIX}/TOGGLE_COMMENT_MODE` as const;
export interface ToggleCommentModeAction {
  type: typeof TOGGLE_COMMENT_MODE;
}

export const SET_SAMPLE_SIZE = `${PREFIX}/SET_SAMPLE_SIZE` as const;
export interface SetSampleSizeAction {
  type: typeof SET_SAMPLE_SIZE;
  value: number;
}

export const SET_LIMIT = `${PREFIX}/SET_LIMIT` as const;
export interface SetLimitAction {
  type: typeof SET_LIMIT;
  value: number;
}

export const APPLY_SETTINGS = `${PREFIX}/APPLY_SETTINGS` as const;
export interface ApplySettingsAction {
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

const reducer: Reducer<SettingsState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<ToggleIsExpandedAction>(action, TOGGLE_IS_EXPANDED)) {
    const isCollapsing = !state.isExpanded === false;
    if (isCollapsing && state.isDirty === true) {
      return { ...INITIAL_STATE };
    }
    return {
      ...state,
      isExpanded: !state.isExpanded,
    };
  }

  if (isAction<ToggleCommentModeAction>(action, TOGGLE_COMMENT_MODE)) {
    return {
      ...state,
      isCommentMode: !state.isCommentMode,
      isDirty: true,
    };
  }

  if (isAction<SetSampleSizeAction>(action, SET_SAMPLE_SIZE)) {
    return {
      ...state,
      sampleSize: action.value,
      isDirty: true,
    };
  }

  if (isAction<SetLimitAction>(action, SET_LIMIT)) {
    return {
      ...state,
      limit: action.value,
      isDirty: true,
    };
  }

  if (isAction<ApplySettingsAction>(action, APPLY_SETTINGS)) {
    return { ...state, isDirty: false };
  }

  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
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
