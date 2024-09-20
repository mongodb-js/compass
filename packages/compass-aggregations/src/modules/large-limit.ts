import type { AnyAction } from 'redux';
import { DEFAULT_LARGE_LIMIT } from '../constants';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type { ApplySettingsAction } from './settings';
import { APPLY_SETTINGS } from './settings';
import { isAction } from '@mongodb-js/compass-utils';

export type LargeLimitState = number;
export const INITIAL_STATE = DEFAULT_LARGE_LIMIT;

export default function reducer(
  state: LargeLimitState = INITIAL_STATE,
  action: AnyAction
): LargeLimitState {
  if (isAction<ApplySettingsAction>(action, APPLY_SETTINGS)) {
    return action.settings.limit ?? state;
  }
  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return INITIAL_STATE;
  }
  return state;
}
