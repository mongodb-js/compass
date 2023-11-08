import { combineReducers } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import type { AppRegistry } from 'hadron-app-registry';
import type { RuntimeAction, RuntimeState } from './runtime';
import runtime from './runtime';

export interface RootState {
  appRegistry: {
    globalAppRegistry: AppRegistry | null;
    localAppRegistry: AppRegistry | null;
  };
  runtime: RuntimeState;
}

export type RootAction = RuntimeAction;

const reducer = combineReducers({
  appRegistry,
  runtime,
});

export default reducer;
