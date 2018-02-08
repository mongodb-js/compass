export const SAVED_PIPELINES_CLOSE = 'aggregations/saved-pipelines/CLOSE';

export const SAVED_PIPELINES_OPEN = 'aggregations/saved-pipelines/OPEN';

export const INITIAL_STATE = {
  pipelines: [],
  isVisible: false
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SAVED_PIPELINES_CLOSE) {
    return { ...state, isVisible: false };
  } else if (action.type === SAVED_PIPELINES_OPEN) {
    return { ...state, isVisible: true };
  }

  return state;
}

export const openSavedPipelines = () => ({
  type: SAVED_PIPELINES_OPEN
});

export const closeSavedPipelines = () => ({
  type: SAVED_PIPELINES_CLOSE
});
