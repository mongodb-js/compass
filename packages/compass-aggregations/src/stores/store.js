import { createStore } from 'redux';
import reducer from 'reducers';

/**
 * The store has a combined pipeline reducer.
 */
const store = createStore(reducer);

export default store;
