import type { Action, Reducer } from 'redux';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { WorkerRuntime } from '@mongosh/node-runtime-worker-thread';
import { ObjectId } from 'bson';
import { createWorkerRuntime } from '../modules/worker-runtime';
import type { ShellPluginExtraArgs } from '../plugin';

const RuntimeMap = new Map<string, WorkerRuntime>();

type State = {
  // Reference to the shell runtime stored by id
  runtimeId: string | null;
  history: string[] | null;
};

type ShellPluginThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  State,
  ShellPluginExtraArgs,
  A
>;

enum ActionTypes {
  RuntimeCreated = 'compass-shell/RuntimeCreated',
  RuntimeDestroyed = 'compass-shell/RuntimeDestroyed',
  HistoryLoaded = 'compass-shell/HistoryLoaded',
  HistorySaved = 'compass-shell/HistorySaved',
}

type RuntimeCreatedAction = { type: ActionTypes.RuntimeCreated; id: string };

type RuntimeDestroyedAction = { type: ActionTypes.RuntimeDestroyed };

type HistoryLoadedAction = {
  type: ActionTypes.HistoryLoaded;
  history: string[];
};

type HistorySavedAction = {
  type: ActionTypes.HistorySaved;
  history: string[];
};

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

const reducer: Reducer<State, Action> = (
  state = { runtimeId: null, history: null },
  action
) => {
  if (isAction<RuntimeCreatedAction>(action, ActionTypes.RuntimeCreated)) {
    return {
      ...state,
      runtimeId: action.id,
    };
  }
  if (isAction<RuntimeDestroyedAction>(action, ActionTypes.RuntimeDestroyed)) {
    return {
      ...state,
      runtimeId: null,
    };
  }
  if (isAction<HistoryLoadedAction>(action, ActionTypes.HistoryLoaded)) {
    return {
      ...state,
      history: action.history,
    };
  }
  if (isAction<HistorySavedAction>(action, ActionTypes.HistorySaved)) {
    return {
      ...state,
      history: action.history,
    };
  }
  return state;
};

export function createAndStoreRuntime(
  dataService: ShellPluginExtraArgs['dataService'],
  { log }: ShellPluginExtraArgs['logger'],
  track: ShellPluginExtraArgs['track'],
  connectionInfo: ShellPluginExtraArgs['connectionInfo']
) {
  const id = new ObjectId().toString();
  const runtime = createWorkerRuntime(
    dataService,
    log.unbound,
    track,
    connectionInfo
  );
  RuntimeMap.set(id, runtime);
  return { id, runtime };
}

export function createRuntime(): ShellPluginThunkAction<
  void,
  RuntimeCreatedAction
> {
  return (
    dispatch,
    getState,
    { dataService, logger, track, connectionInfo }
  ) => {
    // Do not allow to re-create runtime multiple times if it already exists
    if (RuntimeMap.get(getState().runtimeId ?? '')) {
      return;
    }
    const { id } = createAndStoreRuntime(
      dataService,
      logger,
      track,
      connectionInfo
    );
    dispatch({ type: ActionTypes.RuntimeCreated, id });
  };
}

export function destroyCurrentRuntime(): ShellPluginThunkAction<
  void,
  RuntimeDestroyedAction
> {
  return (dispatch, getState) => {
    const id = getState().runtimeId ?? '';
    const runtime = RuntimeMap.get(id);
    runtime?.['eventEmitter'].removeAllListeners();
    void runtime?.terminate();
    RuntimeMap.delete(id);
    dispatch({ type: ActionTypes.RuntimeDestroyed });
  };
}

export function loadHistory(): ShellPluginThunkAction<
  Promise<void>,
  HistoryLoadedAction
> {
  return async (dispatch, _getState, { historyStorage }) => {
    const history = await historyStorage.load();
    dispatch({ type: ActionTypes.HistoryLoaded, history });
  };
}

export function saveHistory(
  newHistory: string[]
): ShellPluginThunkAction<void, HistorySavedAction> {
  return (dispatch, _getState, { historyStorage }) => {
    void historyStorage.save(newHistory).catch(() => {
      // ignore saving errors
    });
    dispatch({ type: ActionTypes.HistorySaved, history: newHistory });
  };
}

export const selectRuntimeById = (state: State) => {
  return RuntimeMap.get(state.runtimeId ?? '') ?? null;
};

export type RootState = State;

export default reducer;
