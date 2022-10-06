import {
  DEFAULT_LARGE_LIMIT
} from '../constants';
import { APPLY_SETTINGS } from './settings';

export const INITIAL_STATE = DEFAULT_LARGE_LIMIT;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === APPLY_SETTINGS) {
    return action.settings.limit ?? state;
  }
  return state;
}
