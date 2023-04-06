import { combineReducers } from 'redux';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import isRunning, {
  toggleIsRunning,
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE,
} from '../is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE,
} from '../is-visible';
import name, { INITIAL_STATE as NAME_INITIAL_STATE } from './name';
import databaseName, {
  INITIAL_STATE as DATABASE_NAME_INITIAL_STATE,
} from '../database-name';
import error, {
  clearError,
  handleError,
  INITIAL_STATE as ERROR_INITIAL_STATE,
} from '../error';
import { reset, RESET } from '../reset';
import dataService from '../data-service';
import appRegistry from '../app-registry';

/**
 * Open action name.
 */
const OPEN = 'databases-collections/drop-collection/OPEN';

const reducer = combineReducers({
  appRegistry,
  isRunning,
  isVisible,
  name,
  databaseName,
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
      databaseName: DATABASE_NAME_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
    };
  } else if (action.type === OPEN) {
    return {
      ...state,
      isVisible: true,
      name: action.collectionName,
      databaseName: action.databaseName,
      isRunning: IS_RUNNING_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * Open create collection action creator.
 */
export const open = (collectionName: string, dbName: string) => ({
  type: OPEN,
  collectionName: collectionName,
  databaseName: dbName,
});

/**
 * The drop collection action.
 */
export const dropCollection = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  AnyAction
> => {
  return async (dispatch, getState) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const collectionName = state.name;
    const dbName = state.databaseName;

    dispatch(clearError());

    if (!ds) {
      return;
    }

    try {
      dispatch(toggleIsRunning(true));
      const namespace = `${dbName}.${collectionName}`;
      await ds.dropCollection(namespace);
      const { appRegistry } = getState();
      appRegistry?.emit('collection-dropped', namespace);
      appRegistry?.emit('refresh-data');
      dispatch(reset());
    } catch (e) {
      dispatch(toggleIsRunning(false));
      dispatch(handleError(e as Error));
    }
  };
};
