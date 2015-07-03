var connect = require('connect-livereload');
var watch = require('watch');
var tinyLR = require('tiny-lr');
var path = require('path');
var src = path.resolve(__dirname, '../../');
var NODE_MODULES_REGEX = /node_modules/;
var debug = require('debug')('scout-server:middleware:livereload');

/**
 * @param {express.Application} app
 * @see http://livereload.com/
 */
module.exports = function(app) {
  var opts = {
    port: 29018,
    host: '127.0.0.1'
  };
  app.use(connect({
    port: opts.port,
    include: [src]
  }));

  debug('Starting tiny-lr server on `%s:%s`', opts.host, opts.port);
  var livereload = tinyLR();
  livereload.listen(opts.port, opts.host);

  watch.watchTree(src, {
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
  debug('Watching `%s` for changes...', src);
};
