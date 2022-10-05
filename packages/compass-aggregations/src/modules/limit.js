import { DEFAULT_SAMPLE_SIZE } from '../constants';
import { APPLY_SETTINGS } from './settings';

export const INITIAL_STATE = DEFAULT_SAMPLE_SIZE;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === APPLY_SETTINGS) {
    return action.settings.sampleSize ?? state
  }
  return state;
}
