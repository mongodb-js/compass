import { createStore } from 'redux';
import reducer from 'modules';

const store = createStore(reducer);

store.onActivated = () => {
};

export default store;
