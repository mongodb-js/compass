import { createStore } from 'redux';
import reducer from 'modules';

/**
 * The store has a combined pipeline reducer.
 */
const store = createStore(reducer);

export default store;
