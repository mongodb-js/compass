import { appRegistryEmit } from 'modules/app-registry';

/**
 * Show the database.
 *
 * @param {String} name - The database name.
 */
export const showDatabase = (name) => {
  return (dispatch, getState) => {
    const appRegistry = getState().appRegistry;
    if (appRegistry) {
      const ipc = require('hadron-ipc');
      dispatch(appRegistryEmit('select-database', name));
      ipc.call('window:hide-collection-submenu');
    }
  };
};
