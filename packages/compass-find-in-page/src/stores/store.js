import { createStore } from 'redux';
import reducer, { toggleStatus } from 'modules';

const store = createStore(reducer);

store.onActivated = (appRegistry) => {
  appRegistry.on('find', () => {
    store.dispatch(toggleStatus());
  });
};

export default store;
