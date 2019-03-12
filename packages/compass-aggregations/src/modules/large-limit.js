import {
  DEFAULT_LARGE_LIMIT
} from '../constants';

export const LARGE_LIMIT_CHANGED =
  'aggregations/large-limit/LARGE_LIMIT_CHANGED';

export const INITIAL_STATE = DEFAULT_LARGE_LIMIT;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === LARGE_LIMIT_CHANGED) {
    return action.largeLimit;
  }
  return state;
}

export const largeLimitChanged = value => ({
  type: LARGE_LIMIT_CHANGED,
  largeLimit: value
});
