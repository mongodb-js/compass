import { createStore, combineReducers } from 'redux';
import type { Store, AnyAction } from 'redux';

import modalReducer from './modal';
import privacyReducer from './privacy';

import { getUserPreferences } from '../utils/user-preferences'

const store = createStore(
  combineReducers({
    modal: modalReducer,
    privacy: privacyReducer,
  }),
);

getUserPreferences();

type StoreActions<T> = T extends Store<unknown, infer A> ? A : never;
type StoreState<T> = T extends Store<infer S, AnyAction> ? S : never;
export type RootActions = StoreActions<typeof store>;
export type RootState = StoreState<typeof store>;

export default store;
