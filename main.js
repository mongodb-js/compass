var server = require('scout-server');
var debug = require('debug')('scout:main');

var STATIC = process.env.WATCH_DIRECTORY || __dirname;
server.start({});

if (process.env.WATCH_DIRECTORY) {
  var watch = require('watch');
  var tinyLR = require('tiny-lr');
  var NODE_MODULES_REGEX = /node_modules/;
  var opts = {
    port: 35729,
    host: '127.0.0.1'
  };

  var livereload = tinyLR();
  livereload.listen(opts.port, opts.host);
  debug('Watching %s for changes', STATIC);
  watch.watchTree(STATIC, {
    filter: function(filename) {
      return !NODE_MODULES_REGEX.test(filename);
    },
    ignoreDotFiles: true
  }, function(files) {
    debug('File change detected!  Sending reload message');
    livereload.changed({
      body: {
        files: files
      }
    });
  });
}
require('./src/electron');
