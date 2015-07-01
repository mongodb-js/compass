var localforage = require('ampersand-sync-localforage');

/**
 * The backend for storing Connection config data.
 * @todo (imlucas) Use system keychain: http://npm.im/xkeychain
 *
 * @return {Object} sync mixin that uses http://npm.im/localforage
 */
module.exports = function() {
  return localforage('Connection');
};
