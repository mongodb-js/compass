console.time('Compass main process migrations');  // eslint-disable-line no-console
const path = require('path');
const pkg = require('../../../package.json');
const electronApp = require('electron').app;
const semver = require('semver');

const debug = require('debug')('mongodb-compass:main:migrations');

function getPreviousVersion(done) {
  const userDataPath = electronApp.getPath('userData');
  const generalPath = path.join(userDataPath, 'AppPreferences', 'General.json');
  try {
    const generalPackage = require(generalPath);
    const lastKnownVersion = generalPackage.lastKnownVersion;
    debug('lastKnownVersion %s', lastKnownVersion);
    if (typeof(lastKnownVersion) === 'string') {
      return done(null, lastKnownVersion);
    }
  } catch (e) {
    // Just use Ampersand Model and run migrations as in the past,
    // perhaps remove this when we are sure our users have upgraded to a
    // recent version of Compass so they don't lose their connection favorites
  }

  const Model = require('ampersand-model');
  const storageMixin = require('storage-mixin');
  const DiskPrefModel = Model.extend(storageMixin, {
    extraProperties: 'ignore',
    idAttribute: 'id',
    namespace: 'AppPreferences',
    storage: {
      backend: 'disk',
      basepath: userDataPath
    },
    props: {
      id: ['string', true, 'General'],
      lastKnownVersion: ['string', false, '']
    }
  });

  // try to get previous version from disk-backed (JSON) model, else return 0.0.0
  const diskPrefs = new DiskPrefModel();
  diskPrefs.once('sync', function(ret) {
    return done(null, ret.lastKnownVersion || '0.0.0');
  });
  diskPrefs.fetch();
}

module.exports = function(done) {
  getPreviousVersion(function(err, previousVersion) {
    if (err) {
      return done(err);
    }
    const currentVersion = pkg.version;
    debug('main process migrations from %s to %s', previousVersion, currentVersion);
    if (semver.eq(previousVersion, currentVersion)) {
      debug('main process - skipping migrations which have already been run');
      console.timeEnd('Compass main process migrations');  // eslint-disable-line no-console
      return done();
    }
    const migrations = {
      '1.2.0-beta.1': require('./1.2.0')
    };
    const migrate = require('app-migrations')(migrations);
    migrate(previousVersion, currentVersion, done);
    console.timeEnd('Compass main process migrations');  // eslint-disable-line no-console
  });
};
