import { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';
import { ThunkAction } from 'redux-thunk';
import { ProfilerThunkAction } from '.';
import { type ObjectId, type Document, Timestamp } from 'bson';

export enum ActionTypes {
  ChooseProfilingDatabase = 'profiler/ChooseDatabase',
  RefreshProfilingDatabaseList = 'profiler/DatabaseList',
  EnableProfiler = 'profiler/Enable',
  DisableProfiler = 'profiler/Disable',
  ClearProfiler = 'profiler/Clear',
  AppendProfiledQueries = 'profiler/AppendProfiledQueries',
  LoadAvailableWiredTigerCache = 'profiler/LoadAvailableWiredTigerCache',
}

type ChooseProfilingDatabaseAction = {
  type: ActionTypes.ChooseProfilingDatabase;
  database?: string;
};

type RefreshProfilingDatabaseListAction = {
  type: ActionTypes.RefreshProfilingDatabaseList;
  databaseList: string[];
};

type EnableProfilerAction = {
  type: ActionTypes.EnableProfiler;
  nextSkip: number;
};

type DisableProfilerAction = {
  type: ActionTypes.DisableProfiler;
};

type ClearProfilerAction = {
  type: ActionTypes.ClearProfiler;
};

type AppendProfiledQueriesAction = {
  type: ActionTypes.AppendProfiledQueries;
  queries: Document[];
  nextSkip: number;
};

type LoadAvailableWiredTigerCacheAction = {
  type: ActionTypes.LoadAvailableWiredTigerCache;
  wiredTigerCache: number;
};

export type ProfilerStatus = 'enabled' | 'disabled' | 'unknown';

export type State = {
  status: ProfilerStatus;
  nextSkip: number;
  profiledQueries: Document[];
  database?: string;
  databaseList: string[];
  wiredTigerCache?: number;
};

export const INITIAL_STATE: State = {
  status: 'disabled',
  nextSkip: 0,
  profiledQueries: [],
  database: undefined,
  databaseList: [],
  wiredTigerCache: 0,
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (
    isAction<ChooseProfilingDatabaseAction>(
      action,
      ActionTypes.ChooseProfilingDatabase
    )
  ) {
    return { ...state, database: action.database };
  } else if (
    isAction<RefreshProfilingDatabaseListAction>(
      action,
      ActionTypes.RefreshProfilingDatabaseList
    )
  ) {
    return { ...state, databaseList: action.databaseList };
  } else if (
    isAction<EnableProfilerAction>(action, ActionTypes.EnableProfiler)
  ) {
    return {
      ...state,
      status: 'enabled',
      nextSkip: action.nextSkip,
      profiledQueries: [],
    };
  } else if (
    isAction<DisableProfilerAction>(action, ActionTypes.DisableProfiler)
  ) {
    return { ...state, status: 'disabled' };
  } else if (isAction<ClearProfilerAction>(action, ActionTypes.ClearProfiler)) {
    return { ...state, nextSkip: 0, profiledQueries: [], database: undefined };
  } else if (
    isAction<AppendProfiledQueriesAction>(
      action,
      ActionTypes.AppendProfiledQueries
    )
  ) {
    return {
      ...state,
      profiledQueries: state.profiledQueries.concat(action.queries),
      nextSkip: action.nextSkip,
    };
  } else if (
    isAction<LoadAvailableWiredTigerCacheAction>(
      action,
      ActionTypes.LoadAvailableWiredTigerCache
    )
  ) {
    return {
      ...state,
      wiredTigerCache: action.wiredTigerCache,
    };
  }

  return state;
}

export const chooseDatabase: (db?: string) => ChooseProfilingDatabaseAction = (
  db
) => {
  return { type: ActionTypes.ChooseProfilingDatabase, database: db };
};

export const refreshDatabaseList: (
  dbs: string[]
) => RefreshProfilingDatabaseListAction = (dbs) => {
  return { type: ActionTypes.RefreshProfilingDatabaseList, databaseList: dbs };
};

export const enableProfiler = (): ProfilerThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const { dataService, profilerState } = getState();
    const database = profilerState.database || 'test';

    if (dataService.dataService) {
      const serverStatus = await dataService.dataService?.serverStatus();
      const wtCache = serverStatus.wiredTiger.cache['maximum bytes configured'];

      await dataService.dataService?.enableProfiler(database);
      dispatch({ type: ActionTypes.EnableProfiler, nextSkip: 0 });
      dispatch({
        type: ActionTypes.LoadAvailableWiredTigerCache,
        wiredTigerCache: wtCache,
      });
    }
  };
};

export const disableProfiler = (): ProfilerThunkAction<Promise<void>> => {
  return async function (dispatch, getState) {
    const { dataService, profilerState } = getState();
    const database = profilerState.database || 'test';

    if (dataService.dataService) {
      await dataService.dataService?.disableProfiler(database);
      dispatch({ type: ActionTypes.DisableProfiler });

      await dispatch(pollLastProfiledQueries());
    }
  };
};

export const clearProfiler: () => ProfilerThunkAction<Promise<void>> = () => {
  return async function (dispatch, getState) {
    const { dataService, profilerState } = getState();
    const database = profilerState.database || 'test';

    if (dataService.dataService) {
      await dataService.dataService?.dropCollection(
        `${database}.system.profile`
      );
    }
    dispatch({ type: ActionTypes.ClearProfiler });
  };
};

export const pollLastProfiledQueries = (): ProfilerThunkAction<
  Promise<void>
> => {
  return async function (dispatch, getState) {
    const { dataService, profilerState } = getState();
    const database = profilerState.database || 'test';

    if (dataService.dataService) {
      const [lastQueries, nextSkip] =
        await dataService.dataService?.findLastProfiledQueries(
          database,
          profilerState.nextSkip
        );

      if (lastQueries.length > 0) {
        dispatch({
          type: ActionTypes.AppendProfiledQueries,
          queries: lastQueries,
          nextSkip,
        });
      }
    }
  };
};
