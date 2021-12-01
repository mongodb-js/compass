import { appRegistryEmit } from './app-registry';

/**
 * Show the database.
 *
 * @param {String} name - The database name.
 */
export const showDatabase = (name) => {
  return (dispatch, getState) => {
    const appRegistry = getState().appRegistry;
    if (appRegistry) {
      dispatch(appRegistryEmit('select-database', name));
    }
  };
};
