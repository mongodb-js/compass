'use strict';
const debug = require('debug')('hadron-build:zip');
const { execFileSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const zipFolder = require('zip-folder');
const { promisify } = require('util');

async function zip(_opts, done) {
  const opts = Object.assign({}, _opts);
  opts.dir = path.resolve(opts.dir);
  opts.out = path.resolve(opts.out);
  opts.platform = opts.platform || process.platform;

  if (path.extname(opts.out).toLowerCase() === '.zip') {
    opts.outPath = opts.out;
    opts.out = path.dirname(opts.out);
  } else {
    opts.outPath =
      path.resolve(opts.out, path.basename(opts.dir, '.app')) + '.zip';
  }

  const runZip = async () => {
    if (opts.platform !== 'darwin') {
      await promisify(zipFolder)(opts.dir, opts.outPath);
    } else {
      const args = ['-r', '--symlinks', opts.outPath, './'];
      execFileSync('zip', args, {
        env: process.env,
        cwd: path.join(opts.dir, '..'),
        stdio: 'inherit',
      });
    }
  };

  const removeZipIfExists = async () => {
    try {
      const stats = await fs.stat(opts.outPath);
      if (!stats.isFile()) {
        throw new Error(
          'Refusing to wipe path "' +
            opts.outPath +
            '" as it is ' +
            (stats.isDirectory() ? 'a directory' : 'not a file')
        );
      }
      await fs.unlink(opts.outPath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
  };

  debug('creating zip', opts);

  try {
    await removeZipIfExists();
    await fs.mkdirs(opts.out);
    await runZip();
    done(null, opts.outPath);
  } catch (err) {
    done(err);
  }
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
module.exports = function (target, done) {
  if (target.platform === 'linux') {
    debug('.zip releases assets for linux disabled');
    return done();
  }
  zip(module.exports.getOptions(target), done);
};

module.exports.getOptions = function (target) {
  const asset = target.getAssetWithExtension('.zip');
  if (!asset) {
    debug('no asset w extension .zip!');
    return null;
  }

  const res = {
    dir: target.appPath,
    out: asset.path,
    platform: target.platform,
  };

  debug('options', res);
  return res;
};
