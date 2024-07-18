'use strict';
const debug = require('debug')('hadron-build:zip');
const { execFileSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const zipFolder = require('zip-folder');

function zip(_opts, done) {
  const opts = Object.assign({}, _opts);
  opts.dir = path.resolve(opts.dir);
  opts.out = path.resolve(opts.out);
  opts.platform = opts.platform || process.platform;

  if (path.extname(opts.out).toLowerCase() === '.zip') {
    opts.outPath = opts.out;
    opts.out = path.dirname(opts.out);
  } else {
    opts.outPath = path.resolve(opts.out, path.basename(opts.dir, '.app')) + '.zip';
  }

  const runZip = () => {
    return new Promise((resolve, reject) => {
      if (opts.platform !== 'darwin') {
        zipFolder(opts.dir, opts.outPath, (err) => {
          if (err) return reject(err);
          return resolve(opts.outPath);
        });
      } else {
        try {
          const args = ['-r', '--symlinks', opts.outPath, './'];
          execFileSync('zip', args, {
            env: process.env,
            cwd: path.join(opts.dir, '..'),
            stdio: 'inherit'
          });
          return resolve(opts.outPath);
        } catch (err) {
          return reject(err);
        }
      }
    });
  }
  
  const removeZipIfExists = async () => {
    try {
      const stats = await fs.stat(opts.outPath);
      if (!stats.isFile()) {
        throw new Error('Refusing to wipe path "' + opts.outPath + '" as it is ' + (stats.isDirectory() ? 'a directory' : 'not a file'));
      }
      return await fs.unlink(opts.outPath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  }
  
  debug('creating zip', opts);
  
  removeZipIfExists()
    .then(() => fs.mkdirs(opts.out))
    .then(() => runZip())
    .then(result => done(null, result))
    .catch(err => done(err));
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
