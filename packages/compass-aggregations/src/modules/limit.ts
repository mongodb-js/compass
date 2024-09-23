import type { AnyAction } from 'redux';
import { DEFAULT_SAMPLE_SIZE } from '../constants';
import { isAction } from '@mongodb-js/compass-utils';

import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type { ApplySettingsAction } from './settings';
import { APPLY_SETTINGS } from './settings';

export type LimitState = number;
export const INITIAL_STATE: LimitState = DEFAULT_SAMPLE_SIZE;

export default function reducer(
  state: LimitState = INITIAL_STATE,
  action: AnyAction
): LimitState {
  if (isAction<ApplySettingsAction>(action, APPLY_SETTINGS)) {
    return action.settings.sampleSize ?? state;
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
