import { createStore, combineReducers, applyMiddleware } from 'redux';
import type { Store, AnyAction } from 'redux';
import thunk from 'redux-thunk';


import modalReducer from './modal';
import settingsReducer from './settings';

const store = createStore(
  combineReducers({
    modal: modalReducer,
    settings: settingsReducer,
  }),
  applyMiddleware(thunk),
);

type StoreActions<T> = T extends Store<unknown, infer A> ? A : never;
type StoreState<T> = T extends Store<infer S, AnyAction> ? S : never;
export type RootActions = StoreActions<typeof store>;
export type RootState = StoreState<typeof store>;

export default store;
