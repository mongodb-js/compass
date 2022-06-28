import { createStore, combineReducers } from 'redux';
import type { Store, AnyAction } from 'redux';
import ipc from 'hadron-ipc';

import modalReducer, { toggleModal } from './modal';

const store = createStore(
  combineReducers({
    modal: modalReducer,
  }),
);

// todo: validate
(ipc as any).on('window:show-network-optin', () => {
  store.dispatch(toggleModal(true));
});


type StoreActions<T> = T extends Store<unknown, infer A> ? A : never;
type StoreState<T> = T extends Store<infer S, AnyAction> ? S : never;
export type RootActions = StoreActions<typeof store>;
export type RootState = StoreState<typeof store>;

export default store;
