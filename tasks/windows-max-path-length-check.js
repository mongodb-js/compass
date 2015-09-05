/**
 * Will you hit the [Windows Maximum Path Length Limitation][1]?
 *
 * [1]: https://msdn.microsoft.com/en-us/library/windows/desktop/aa365247(v=vs.85).aspx#maxpath
 */
process.env.DEBUG = '*';
var path = require('path');
var debug = require('debug')('windows-max-path-length-check');
var platform = require(path.join(__dirname, process.platform));
var glob = require('glob');

var MAX_PATH = 260;

module.exports = function(src, dest, done) {
  if (typeof dest === 'function') {
    done = dest;
    dest = src;
  }

  src = path.resolve(src);

  glob.glob(src, {}, function(err, files) {
    if (err) {
      return done(err);
    }

    debug('Checking %d files', files.length);
    var destPaths = files.map(function(file) {
      return file.replace(process.cwd(), dest);
    });

    var tooLong = destPaths.filter(function(file) {
      return file.length + 1 >= MAX_PATH;
    });
    debug('%d paths too long!', tooLong.length);
    debug('paths that are too long: ', tooLong);
  });
};

module.exports(path.join(process.cwd(), 'build/{!*.asar,*,**/*}'), path.resolve(platform.RESOURCES), console.error.bind(console));
