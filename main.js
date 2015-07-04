var server = require('scout-server');

server.start({
  static: __dirname
});

require('./src/electron');
