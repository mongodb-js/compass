var localforage = require('ampersand-sync-localforage');

/**
 * The backend for storing Connection config data.
 * @todo (imlucas) Use system keychain: http://npm.im/xkeychain
 */
module.exports = localforage('Connection');
