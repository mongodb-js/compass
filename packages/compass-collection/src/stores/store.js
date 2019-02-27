import { createStore } from 'redux';
import reducer from 'modules';

const store = createStore(reducer);

export default store;
