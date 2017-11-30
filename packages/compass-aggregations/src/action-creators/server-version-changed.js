/**
 * Server version changed action.
 */
const SERVER_VERSION_CHANGED = 'SERVER_VERSION_CHANGED';

/**
 * Action creator for server version changed events.
 *
 * @param {String} version - The version value.
 *
 * @returns {Object} The server version changed action.
 */
const serverVersionChanged = (version) => ({
  type: SERVER_VERSION_CHANGED,
  version: version
});

export { serverVersionChanged, SERVER_VERSION_CHANGED };
