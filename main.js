var server = require('scout-server');
var watch = require('watch');
var tinyLR = require('tiny-lr');

var NODE_MODULES_REGEX = /node_modules/;
var opts = {
  port: 35729,
  host: '127.0.0.1'
};

var livereload = tinyLR();
livereload.listen(opts.port, opts.host);

watch.watchTree(__dirname, {
  filter: function(filename) {
    return !NODE_MODULES_REGEX.test(filename);
  },
  ignoreDotFiles: true
}, function(files) {
  console.log('File change detected!  Sending reload message');
  livereload.changed({
    body: {
      files: files
    }
  });
});

server.start({
  static: __dirname
});

require('./src/electron');
