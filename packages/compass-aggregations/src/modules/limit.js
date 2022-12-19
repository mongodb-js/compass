import { DEFAULT_SAMPLE_SIZE } from '../constants';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { APPLY_SETTINGS } from './settings';

export const INITIAL_STATE = DEFAULT_SAMPLE_SIZE;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === APPLY_SETTINGS) {
    return action.settings.sampleSize ?? state
  }
  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
    return INITIAL_STATE;
  }
  return state;
}
