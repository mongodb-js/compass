/**
 * The entrypoint bin/mongodb-scout-server.js will call
 * to start the server.
 */
var debug = require('debug')('scout:bin:mongodb-scout-server');
var path = require('path');

var src = path.join(process.env.RESOURCES_PATH, 'scout-server.asar');
debug('loading server from `%s`...', src);
var server = require(src);
server.server.on('error', function(err) {
  console.error('mongodb-scout-server encountered an error', err.stack);
  console.log('error data %j', err);
});
debug('starting...');
server.start();
