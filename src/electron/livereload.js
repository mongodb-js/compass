var path = require('path');
var watch = require('watch');
var tinyLR = require('tiny-lr');
var debounce = require('lodash').debounce;
var debug = require('debug')('scout:electron:livereload');

var NODE_MODULES_REGEX = /node_modules/;
var WATCH_DIRECTORY = path.join(__dirname, '..', '..');

var opts = {
  port: 35729,
  host: '127.0.0.1',
  filter: function(filename) {
    return !NODE_MODULES_REGEX.test(filename);
  },
  ignoreDotFiles: true
};

var livereload = tinyLR();
livereload.listen(opts.port, opts.host);
debug('livereload server started on %s:%d', opts.host, opts.port);

var onFileschanged = debounce(function(files) {
  debug('File change detected!  Sending reload message', Object.keys(files));
  livereload.changed({
    body: {
      files: files
    }
  });
}, 200);

watch.watchTree(WATCH_DIRECTORY, opts, onFileschanged);
debug('watching `%s` for changes...', WATCH_DIRECTORY);
