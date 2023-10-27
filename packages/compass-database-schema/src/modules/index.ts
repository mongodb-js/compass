import type { Action, AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import type { ThunkAction } from 'redux-thunk';
import { default as databaseSchema } from './database-schema';
import { default as dataService } from './data-service';

export type DatabaseSchemaThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, RootState, never, A>;

const reducer = combineReducers({
  databaseSchema,
  dataService,
});

export type RootState = ReturnType<typeof reducer> & {
  globalAppRegistry?: AppRegistry;
  localAppRegistry?: AppRegistry;
};

export default reducer;
