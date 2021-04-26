import { DEFAULT_MAX_TIME_MS } from '../constants';

export const MAX_TIME_MS_CHANGED =
  'aggregations/max-time-ms/MAX_TIME_MS_CHANGED';

export const INITIAL_STATE = DEFAULT_MAX_TIME_MS;

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === MAX_TIME_MS_CHANGED) {
    return action.maxTimeMS;
  }
  return state;
}

export const maxTimeMSChanged = value => ({
  type: MAX_TIME_MS_CHANGED,
  maxTimeMS: value
});
