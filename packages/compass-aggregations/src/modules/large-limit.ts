import type { RootAction } from '.';
import { DEFAULT_LARGE_LIMIT } from '../constants';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { APPLY_SETTINGS } from './settings';

export type LargeLimitState = number;
export const INITIAL_STATE = DEFAULT_LARGE_LIMIT;

export default function reducer(
  state: LargeLimitState = INITIAL_STATE,
  action: RootAction
): LargeLimitState {
  if (action.type === APPLY_SETTINGS) {
    return action.settings.limit ?? state;
  }
  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
    return INITIAL_STATE;
  }
  return state;
}
