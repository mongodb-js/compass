import { createStore } from 'redux';
import reducer from 'modules';

/**
 * The change status ipc event name.
 */
export const CHANGE_STATUS = 'compass:loading:change-status';

/**
 * Configure this store for use within an application.
 *
 * @param {Object} options - The options to configure the store with.
 *
 * @option {Object} ipc - The ipc interface to send/receive events on.
 *
 * @returns {Store} The store.
 */
const configureStore = (options = {}) => {
  const store = createStore(reducer);

  if (options.ipc) {
    options.ipc.on(CHANGE_STATUS, (status) => {
      // Dispatch the change status action.
    });
  }

  return store;
};

export default configureStore;
