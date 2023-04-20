import { combineReducers } from 'redux';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

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
import appRegistry from '../app-registry';

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
  appRegistry,
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
  Promise<void>,
  RootState,
  void,
  AnyAction
> => {
  return async (
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
      await ds.dropDatabase(dbName);
      const { appRegistry } = getState();
      appRegistry?.emit('database-dropped', dbName);
      appRegistry?.emit('refresh-data');
      dispatch(reset());
    } catch (e: any) {
      dispatch(toggleIsRunning(false));
      dispatch(handleError(e));
    }
  };
};
