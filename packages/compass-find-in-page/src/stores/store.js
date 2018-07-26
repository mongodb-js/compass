import { toggleStatus } from 'modules/find-in-page';
import { createStore } from 'redux';
import reducer from 'modules';

const store = createStore(reducer);

store.onActivated = (appRegistry) => {
  appRegistry.on('find', () => {
    console.log('DISPATCHING FIND');
    store.dispatch(toggleStatus());
  });
};

export default store;
