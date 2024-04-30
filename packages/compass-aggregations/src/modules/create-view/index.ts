import type { Reducer } from 'redux';
import parseNs from 'mongodb-ns';
import type { Document } from 'bson';
import type { CreateViewThunkAction } from '../../stores/create-view';
import { isAction } from '../../utils/is-action';

export type CreateViewState = {
  isRunning: boolean;
  isVisible: boolean;
  isDuplicating: boolean;
  name: string;
  error: Error | null;
  source: string;
  pipeline: unknown[];
};

export const INITIAL_STATE: CreateViewState = {
  isRunning: false,
  isVisible: false,
  isDuplicating: false,
  name: '',
  error: null,
  source: '',
  pipeline: [],
};

enum CreateViewActionTypes {
  Open = 'aggregations/create-view/Open',
  ToggleIsVisible = 'aggregations/create-view/is-visible/ToggleIsVisible',
  ToggleIsRunning = 'aggregations/create-view/is-running/ToggleIsRunning',
  HandleError = 'aggregations/create-view/error/HandleError',
  ClearError = 'aggregations/create-view/error/ClearError',
  ChangeViewName = 'aggregations/create-view/name/ChangeName',
  Reset = 'aggregations/create-view/reset',
}

export type OpenAction = {
  type: CreateViewActionTypes.Open;
  source: string;
  pipeline: unknown[];
  duplicate: boolean;
};

export type ToggleIsVisibleAction = {
  type: CreateViewActionTypes.ToggleIsVisible;
  isVisible: boolean;
};

export type ToggleIsRunningAction = {
  type: CreateViewActionTypes.ToggleIsRunning;
  isRunning: boolean;
};

export type HandleErrorAction = {
  type: CreateViewActionTypes.HandleError;
  error: Error;
};

export type ClearErrorAction = {
  type: CreateViewActionTypes.ClearError;
};

export type ChangeViewNameAction = {
  type: CreateViewActionTypes.ChangeViewName;
  name: string;
};

export type ResetAction = {
  type: CreateViewActionTypes.Reset;
};

export type CreateViewAction =
  | ToggleIsRunningAction
  | ToggleIsVisibleAction
  | HandleErrorAction
  | ClearErrorAction
  | ChangeViewNameAction
  | ResetAction
  | OpenAction;

export const open = (
  sourceNs: string,
  sourcePipeline: unknown[],
  duplicate: boolean
): OpenAction => ({
  type: CreateViewActionTypes.Open,
  source: sourceNs,
  pipeline: sourcePipeline,
  duplicate: duplicate,
});

export const toggleIsVisible = (isVisible: boolean): ToggleIsVisibleAction => ({
  type: CreateViewActionTypes.ToggleIsVisible,
  isVisible: isVisible,
});

export const toggleIsRunning = (isRunning: boolean): ToggleIsRunningAction => ({
  type: CreateViewActionTypes.ToggleIsRunning,
  isRunning: isRunning,
});

export const handleError = (error: Error): HandleErrorAction => ({
  type: CreateViewActionTypes.HandleError,
  error: error,
});

export const clearError = (): ClearErrorAction => ({
  type: CreateViewActionTypes.ClearError,
});

export const changeViewName = (name: string): ChangeViewNameAction => ({
  type: CreateViewActionTypes.ChangeViewName,
  name: name,
});

export const reset = (): ResetAction => ({
  type: CreateViewActionTypes.Reset,
});

/**
 * The main reducer.
 */
const reducer: Reducer<CreateViewState, CreateViewAction> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<ResetAction>(action, CreateViewActionTypes.Reset)) {
    return { ...INITIAL_STATE };
  }
  if (isAction<OpenAction>(action, CreateViewActionTypes.Open)) {
    return {
      ...state,
      ...INITIAL_STATE,
      isVisible: true,
      isDuplicating: action.duplicate,
      source: action.source,
      pipeline: action.pipeline,
    };
  }
  if (
    isAction<ToggleIsRunningAction>(
      action,
      CreateViewActionTypes.ToggleIsRunning
    )
  ) {
    return {
      ...state,
      isRunning: action.isRunning,
    };
  }
  if (
    isAction<ToggleIsVisibleAction>(
      action,
      CreateViewActionTypes.ToggleIsVisible
    )
  ) {
    return {
      ...state,
      isVisible: action.isVisible,
    };
  }
  if (
    isAction<ChangeViewNameAction>(action, CreateViewActionTypes.ChangeViewName)
  ) {
    return {
      ...state,
      name: action.name,
    };
  }
  if (isAction<HandleErrorAction>(action, CreateViewActionTypes.HandleError)) {
    return {
      ...state,
      error: action.error,
    };
  }
  if (isAction<ClearErrorAction>(action, CreateViewActionTypes.ClearError)) {
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
 * The create view action.
 */
export const createView = (): CreateViewThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    {
      globalAppRegistry,
      dataService,
      logger: { track },
      workspaces,
      connectionInfoAccess,
    }
  ) => {
    const state = getState();

    const viewName = state.name;
    const viewSource = state.source;
    const { database } = parseNs(state.source);
    const viewPipeline = state.pipeline;
    const options = {};

    dispatch(clearError());
    const { id: connectionId } =
      connectionInfoAccess.getCurrentConnectionInfo();

    try {
      dispatch(toggleIsRunning(true));
      await dataService.createView(
        viewName,
        viewSource,
        viewPipeline as Document[],
        options
      );
      const ns = `${database}.${viewName}`;
      track('Aggregation Saved As View', { num_stages: viewPipeline.length });
      globalAppRegistry.emit('view-created', ns);
      workspaces.openCollectionWorkspace(connectionId, ns, { newTab: true });
      dispatch(reset());
    } catch (e) {
      dispatch(stopWithError(e as Error));
    }
  };
};
