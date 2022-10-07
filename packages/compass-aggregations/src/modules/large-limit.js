import {
  DEFAULT_LARGE_LIMIT
} from '../constants';
import { NEW_PIPELINE } from './import-pipeline';
import { CLEAR_PIPELINE } from './pipeline';
import { APPLY_SETTINGS } from './settings';

export const INITIAL_STATE = DEFAULT_LARGE_LIMIT;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === APPLY_SETTINGS) {
    return action.settings.limit ?? state;
  }
  if (action.type === NEW_PIPELINE || action.type === CLEAR_PIPELINE) {
    return INITIAL_STATE;
  }
  return state;
}
