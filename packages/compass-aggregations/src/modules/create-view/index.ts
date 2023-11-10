import type { Reducer } from 'redux';
import parseNs from 'mongodb-ns';
import type { Document } from 'bson';
import type { CreateViewThunkAction } from '../../stores/create-view';

export const TOGGLE_IS_RUNNING =
  'aggregations/create-view/is-running/TOGGLE_IS_RUNNING';

export const toggleIsRunning = (isRunning: boolean) => ({
  type: TOGGLE_IS_RUNNING,
  isRunning: isRunning,
});

export const TOGGLE_IS_VISIBLE =
  'aggregations/create-view/is-visible/TOGGLE_IS_VISIBLE';

export const toggleIsVisible = (isVisible: boolean) => ({
  type: TOGGLE_IS_VISIBLE,
  isVisible: isVisible,
});

/**
 * Handle error action name.
 */
export const HANDLE_ERROR = `aggregations/create-view/error/HANDLE_ERROR`;

/**
 * Handle error action creator.
 */
export const handleError = (error: Error) => ({
  type: HANDLE_ERROR,
  error: error,
});

export const CLEAR_ERROR = `aggregations/create-view/error/CLEAR_ERROR`;

export const clearError = () => ({
  type: CLEAR_ERROR,
});

export const CHANGE_VIEW_NAME = 'aggregations/create-view/name/CHANGE_NAME';

export const changeViewName = (name: string) => ({
  type: CHANGE_VIEW_NAME,
  name: name,
});

export const RESET = 'aggregations/create-view/reset';

export const reset = () => ({
  type: RESET,
});

/**
 * Open action name.
 */
const OPEN = 'aggregations/create-view/OPEN';

type CreateViewState = {
  isRunning: boolean;
  isVisible: boolean;
  isDuplicating: boolean;
  name: string;
  error: Error | null;
  source: string;
  pipeline: unknown[];
};

export const INITIAL_STATE = {
  isRunning: false,
  isVisible: false,
  isDuplicating: false,
  name: '',
  error: null,
  source: '',
  pipeline: [],
};

/**
 * The main reducer.
 */
const reducer: Reducer<CreateViewState> = (state = INITIAL_STATE, action) => {
  if (action.type === RESET) {
    return { ...INITIAL_STATE };
  }
  if (action.type === OPEN) {
    return {
      ...state,
      ...INITIAL_STATE,
      isVisible: true,
      isDuplicating: action.duplicate,
      source: action.source,
      pipeline: action.pipeline,
    };
  }
  if (action.type === TOGGLE_IS_RUNNING) {
    return {
      ...state,
      isRunning: action.isRunning,
    };
  }
  if (action.type === TOGGLE_IS_VISIBLE) {
    return {
      ...state,
      isVisible: action.isVisible,
    };
  }
  if (action.type === CHANGE_VIEW_NAME) {
    return {
      ...state,
      name: action.name,
    };
  }
  if (action.type === HANDLE_ERROR) {
    return {
      ...state,
      error: action.error,
    };
  }
  if (action.type === CLEAR_ERROR) {
    return {
      ...state,
      error: null,
    };
  }
  return state;
};

export default reducer;

/**
 * Stop progress and set the error.
 */
const stopWithError = (err: Error): CreateViewThunkAction<void> => {
  return (dispatch) => {
    dispatch(toggleIsRunning(false));
    dispatch(handleError(err));
  };
};

/**
 * Open create view action creator.
 */
export const open = (
  sourceNs: string,
  sourcePipeline: unknown[],
  duplicate: boolean
) => ({
  type: OPEN,
  source: sourceNs,
  pipeline: sourcePipeline,
  duplicate: duplicate,
});

/**
 * The create view action.
 */
export const createView = (): CreateViewThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { globalAppRegistry, dataService, logger: { debug, track } }
  ) => {
    debug('creating view!');
    const state = getState();

    const viewName = state.name;
    const viewSource = state.source;
    const { database } = parseNs(state.source);
    const viewPipeline = state.pipeline;
    const options = {};

    dispatch(clearError());

    try {
      dispatch(toggleIsRunning(true));
      debug(
        'calling data-service.createView',
        viewName,
        viewSource,
        viewPipeline,
        options
      );
      await dataService.createView(
        viewName,
        viewSource,
        viewPipeline as Document[],
        options
      );
      debug('View created!');
      track('Aggregation Saved As View', { num_stages: viewPipeline.length });
      globalAppRegistry.emit(
        'create-view-open-result-namespace',
        `${database}.${viewName}`
      );
      dispatch(reset());
    } catch (e) {
      debug('error creating view', e);
      dispatch(stopWithError(e as Error));
    }
  };
};
