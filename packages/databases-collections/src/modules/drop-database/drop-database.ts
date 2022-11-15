import { combineReducers } from 'redux';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';

import isRunning, {
  toggleIsRunning,
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE,
} from '../is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE,
} from '../is-visible';
import error, {
  clearError,
  handleError,
  INITIAL_STATE as ERROR_INITIAL_STATE,
} from '../error';
import { reset, RESET } from '../reset';
import dataService from '../data-service';
import name, { INITIAL_STATE as NAME_INITIAL_STATE } from './name';

/**
 * Open action name.
 */
const OPEN = 'databases-collections/drop-database/OPEN';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isRunning,
  isVisible,
  name,
  error,
  dataService,
});

export type RootState = ReturnType<typeof reducer>;

/**
 * The root reducer.
 */
const rootReducer = (state: RootState, action: AnyAction): RootState => {
  if (action.type === RESET) {
    return {
      ...state,
      isRunning: IS_RUNNING_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      name: NAME_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
    };
  } else if (action.type === OPEN) {
    return {
      ...state,
      isVisible: true,
      name: action.name,
      isRunning: IS_RUNNING_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * Stop progress and set the error.
 */
const stopWithError = (
  dispatch: ThunkDispatch<RootState, void, AnyAction>,
  err: Error
) => {
  dispatch(toggleIsRunning(false));
  return dispatch(handleError(err));
};

/**
 * Open drop database action creator.
 */
export const open = (dbName: string) => ({
  type: OPEN,
  name: dbName,
});

/**
 * The drop database action.
 */
export const dropDatabase = (): ThunkAction<
  void,
  RootState,
  void,
  AnyAction
> => {
  return (
    dispatch: ThunkDispatch<RootState, void, AnyAction>,
    getState: () => RootState
  ) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const dbName = state.name;

    dispatch(clearError());

    if (!ds) {
      return;
    }

    try {
      dispatch(toggleIsRunning(true));
      ds.dropDatabase(dbName, (e: any) => {
        if (e) {
          return stopWithError(dispatch, e);
        }
        ((global as any).hadronApp?.appRegistry as AppRegistry).emit(
          'database-dropped',
          dbName
        );
        ((global as any).hadronApp?.appRegistry as AppRegistry).emit(
          'refresh-data'
        );
        dispatch(reset());
      });
    } catch (e: any) {
      return stopWithError(dispatch, e as Error);
    }
  };
};
