import { DEFAULT_SAMPLE_SIZE } from '../constants';

export const LIMIT_CHANGED = 'aggregations/limit/LIMIT_CHANGED';

export const INITIAL_STATE = DEFAULT_SAMPLE_SIZE;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === LIMIT_CHANGED) {
    return action.limit;
  }
  return state;
}

export const limitChanged = limit => ({
  type: LIMIT_CHANGED,
  limit: limit
});
