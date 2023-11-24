import type { RootAction } from '.';
import { DEFAULT_SAMPLE_SIZE } from '../constants';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { APPLY_SETTINGS } from './settings';

export type LimitState = number;
export const INITIAL_STATE: LimitState = DEFAULT_SAMPLE_SIZE;

export default function reducer(
  state: LimitState = INITIAL_STATE,
  action: RootAction
): LimitState {
  if (action.type === APPLY_SETTINGS) {
    return action.settings.sampleSize ?? state;
  }
  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
    return INITIAL_STATE;
  }
  return state;
}
