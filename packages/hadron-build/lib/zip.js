const zip = require('electron-installer-zip');
const debug = require('debug')('hadron-build:zip');

/**
 * Packages the app as a plain zip using `electron-installer-zip`
 * for auto-updates.
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
