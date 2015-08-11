/**
 * The main entrypoint for the application!
 * @see ./app.js
 */
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}
/**
 * @todo (imlucas): Can be removed?
 */
require('phantomjs-polyfill');

require('./app');
