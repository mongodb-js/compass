import type { AnyAction } from 'redux';
import type { DatabaseSchemaThunkAction } from '.';
import type { DatabaseSchema } from '../utils/analyze-database';
import { loadDatabaseSchemaForDatabase } from '../utils/analyze-database';

export enum ActionTypes {
  SelectDatabase = 'database-schema/SelectDatabase',
  LoadDatabaseSchema = 'database-schema/LoadDatabaseSchema',
  SetDatabaseSchema = 'database-schema/SetDatabaseSchema',
}

type SelectDatabaseAction = {
  type: ActionTypes.SelectDatabase;
  databaseName: string;
};

type LoadDatabaseSchemaAction = {
  type: ActionTypes.LoadDatabaseSchema;
};

type SetDatabaseSchemaAction = {
  type: ActionTypes.SetDatabaseSchema;
  schema: DatabaseSchema;
};

export type Actions =
  | SelectDatabaseAction
  | LoadDatabaseSchemaAction
  | SetDatabaseSchemaAction;

export type DatabaseSchemaStatus = 'disabled' | 'loading' | 'ready';

export type State = {
  status: DatabaseSchemaStatus;
  schema?: DatabaseSchema;
  databaseName?: string;
};

export const INITIAL_STATE: State = {
  status: 'disabled',
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (action.type === ActionTypes.SelectDatabase) {
    return {
      ...INITIAL_STATE,
      status: 'disabled',
      databaseName: action.databaseName,
    };
  } else if (action.type === ActionTypes.LoadDatabaseSchema) {
    return {
      ...state,
      status: 'loading',
    };
  } else if (action.type === ActionTypes.SetDatabaseSchema) {
    return {
      ...state,
      status: 'ready',
      schema: action.schema,
    };
  }
  return state;
}

export const selectDatabase = (databaseName: string) => ({
  type: ActionTypes.SelectDatabase,
  databaseName,
});

export const loadDatabaseSchema = (): DatabaseSchemaThunkAction<
  Promise<void>,
  Actions
> => {
  return async function (dispatch, getState) {
    const state = getState();
    const { dataService } = state.dataService;
    const { databaseName, status } = state.databaseSchema;

    console.log({ dataService, databaseName, status });

    if (!dataService || !databaseName || status !== 'disabled') {
      console.log('returning early');
      return;
    }

    console.log('loading schema...');

    dispatch({ type: ActionTypes.LoadDatabaseSchema });

    // TODO: This can error. We probably also want to add support for progress
    const schema = await loadDatabaseSchemaForDatabase(
      dataService,
      databaseName
    );
    dispatch({
      type: ActionTypes.SetDatabaseSchema,
      schema,
    });
  };
};
