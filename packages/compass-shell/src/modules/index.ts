import { combineReducers } from 'redux';
import type { RuntimeAction, RuntimeState } from './runtime';
import runtime from './runtime';

export interface RootState {
  runtime: RuntimeState;
}

export type RootAction = RuntimeAction;

const reducer = combineReducers({
  runtime,
});

export default reducer;
