const debug = require('debug')('hadron-build:zip');

const { execFileSync } = require('child_process');
var fs = require('fs-extra');
var path = require('path');
var zipFolder = require('zip-folder');
var series = require('async').series;

function zip(_opts, done) {
  var opts = Object.assign({}, _opts);
  opts.dir = path.resolve(opts.dir);
  opts.out = path.resolve(opts.out);
  opts.platform = opts.platform || process.platform;
  if (path.extname(opts.out).toLowerCase() === '.zip') {
    opts.outPath = opts.out;
    opts.out = path.dirname(opts.out);
  } else {
    opts.outPath = path.resolve(opts.out, path.basename(opts.dir, '.app')) + '.zip';
  }

  function runZip(cb) {
    if (opts.platform !== 'darwin') {
      zipFolder(opts.dir, opts.outPath, cb);
      return;
    }

    var args = [
      '-r',
      '--symlinks',
      opts.outPath,
      './'
    ];

    execFileSync('zip', args, {
      env: process.env,
      cwd: path.join(opts.dir, '..'),
      stdio: 'inherit'
    });

    cb(null, opts.outPath);
  }

  debug('creating zip', opts);

  series([
    function removeZipIfExists(cb) {
      fs.stat(opts.outPath, function(err, stats) {
        if (err) return cb(null);

        if (!stats.isFile()) {
          return cb(new Error('Refusing to wipe path "' + opts.outPath + '" as it is ' + (stats.isDirectory() ? 'a directory' : 'not a file')));
        }
        return fs.unlink(opts.outPath, cb);
      });
    },
    fs.mkdirs.bind(null, opts.out),
    runZip
  ], function(err) {
    if (err) {
      return done(err);
    }
    done(null, opts.outPath);
  });
}

/**
 * Packages the app as a plain zip for auto-updates.
 *
 * NOTE (imlucas) This should be run after the installers have been
 * created.  The modules that generate the installers also
 * handle signinging the assets. If we zip unsigned assets
 * and publish them for the release, auto updates will be rejected.
 *
 * @param {Target} target
 * @param {Function} done
 * @return {void}
 */
module.exports = function(target, done) {
  if (target.platform === 'linux') {
    debug('.zip releases assets for linux disabled');
    return done();
  }
  zip(module.exports.getOptions(target), done);
};

module.exports.getOptions = function(target) {
  const asset = target.getAssetWithExtension('.zip');
  if (!asset) {
    debug('no asset w extension .zip!');
    return null;
  }

  const res = {
    dir: target.appPath,
    out: asset.path,
    platform: target.platform
  };

  debug('options', res);
  return res;
};
