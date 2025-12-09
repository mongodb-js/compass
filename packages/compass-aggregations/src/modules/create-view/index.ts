import type { Reducer } from 'redux';
import parseNs from 'mongodb-ns';
import type { Document } from 'bson';
import type { CreateViewThunkAction } from '../../stores/create-view';
import { isAction } from '../../utils/is-action';

export type CreateViewState = {
  connectionId: string;
  isRunning: boolean;
  isVisible: boolean;
  isDuplicating: boolean;
  name: string;
  error: Error | null;
  source: string;
  pipeline: unknown[];
};

export const INITIAL_STATE: CreateViewState = {
  connectionId: '',
  isRunning: false,
  isVisible: false,
  isDuplicating: false,
  name: '',
  error: null,
  source: '',
  pipeline: [],
};

const CreateViewActionTypes = {
  Open: 'aggregations/create-view/Open',
  Close: 'aggregations/create-view/Close',
  ToggleIsRunning: 'aggregations/create-view/is-running/ToggleIsRunning',
  HandleError: 'aggregations/create-view/error/HandleError',
  ClearError: 'aggregations/create-view/error/ClearError',
  ChangeViewName: 'aggregations/create-view/name/ChangeName',
  Reset: 'aggregations/create-view/reset',
} as const;

export type OpenAction = {
  type: typeof CreateViewActionTypes.Open;
  connectionId: string;
  source: string;
  pipeline: unknown[];
  duplicate: boolean;
};

export type CloseAction = {
  type: typeof CreateViewActionTypes.Close;
};

export type ToggleIsRunningAction = {
  type: typeof CreateViewActionTypes.ToggleIsRunning;
  isRunning: boolean;
};

export type HandleErrorAction = {
  type: typeof CreateViewActionTypes.HandleError;
  error: Error;
};

export type ClearErrorAction = {
  type: typeof CreateViewActionTypes.ClearError;
};

export type ChangeViewNameAction = {
  type: typeof CreateViewActionTypes.ChangeViewName;
  name: string;
};

export type ResetAction = {
  type: typeof CreateViewActionTypes.Reset;
};

export type CreateViewAction =
  | OpenAction
  | CloseAction
  | ResetAction
  | ToggleIsRunningAction
  | HandleErrorAction
  | ClearErrorAction
  | ChangeViewNameAction;

export const open = ({
  connectionId,
  sourceNs,
  sourcePipeline,
  duplicate,
}: {
  connectionId: string;
  sourceNs: string;
  sourcePipeline: unknown[];
  duplicate: boolean;
}): OpenAction => ({
  type: CreateViewActionTypes.Open,
  connectionId,
  source: sourceNs,
  pipeline: sourcePipeline,
  duplicate: duplicate,
});

export const close = (): CloseAction => ({
  type: CreateViewActionTypes.Close,
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
  if (
    isAction<ResetAction>(action, CreateViewActionTypes.Reset) ||
    isAction<CloseAction>(action, CreateViewActionTypes.Close)
  ) {
    return { ...INITIAL_STATE };
  }
  if (isAction<OpenAction>(action, CreateViewActionTypes.Open)) {
    return {
      ...state,
      ...INITIAL_STATE,
      isVisible: true,
      connectionId: action.connectionId,
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
    { globalAppRegistry, connections, track, workspaces }
  ) => {
    const {
      name: viewName,
      source: viewSource,
      pipeline: viewPipeline,
      connectionId,
    } = getState();
    const { database } = parseNs(viewSource);
    const options = {};

    dispatch(clearError());

    try {
      const dataService = connections.getDataServiceForConnection(connectionId);

      dispatch(toggleIsRunning(true));
      await dataService.createView(
        viewName,
        viewSource,
        viewPipeline as Document[],
        options
      );
      const ns = `${database}.${viewName}`;
      track(
        'Aggregation Saved As View',
        { num_stages: viewPipeline.length },
        connections.getConnectionById(connectionId)?.info
      );
      globalAppRegistry.emit('view-created', ns, {
        connectionId,
      });
      workspaces.openCollectionWorkspace(connectionId, ns, { newTab: true });
      dispatch(reset());
    } catch (e) {
      dispatch(stopWithError(e as Error));
    }
  };
};
