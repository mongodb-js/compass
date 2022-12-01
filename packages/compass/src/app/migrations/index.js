const Model = require('ampersand-model');
const storageMixin = require('storage-mixin');
const semver = require('semver');
const electronApp = require('@electron/remote').app;

const debug = require('debug')('mongodb-compass:migrations');

function getPreviousVersion(done) {
  const DiskPrefModel = Model.extend(storageMixin, {
    extraProperties: 'ignore',
    idAttribute: 'id',
    namespace: 'AppPreferences',
    storage: {
      backend: 'disk',
      basepath: electronApp.getPath('userData'),
    },
    props: {
      id: ['string', true, 'General'],
      lastKnownVersion: ['string', false, ''],
    },
  });

  const IndexedDBPrefModel = DiskPrefModel.extend({
    namespace: 'Preferences',
    storage: {
      backend: 'local',
      appName: electronApp.getName(),
    },
  });

  // first try to get previous version from disk-backed (JSON) model
  const diskPrefs = new DiskPrefModel();
  diskPrefs.once('sync', function (ret) {
    if (ret.lastKnownVersion) {
      return done(null, ret.lastKnownVersion);
    }
    // if that is not present, try IndexedDB-backed model (pre-1.2.0)
    const indexedDBPrefs = new IndexedDBPrefModel();
    indexedDBPrefs.once('sync', function (ret2) {
      // return version, or 0.0.0 if no version present
      return done(null, ret2.lastKnownVersion || '0.0.0');
    });
    indexedDBPrefs.fetch();
  });
  diskPrefs.fetch();
}

module.exports = function (done) {
  getPreviousVersion(function (err, previousVersion) {
    if (err) {
      done(err);
    }
    const currentVersion = electronApp.getVersion();
    if (currentVersion.match(/^0\.0\.0/)) {
      debug(
        `running with placeholder version ${currentVersion} - skipping migrations`
      );
      return done();
    }

    debug(
      'renderer process migrations from %s to %s',
      previousVersion,
      currentVersion
    );
    if (semver.eq(previousVersion, currentVersion)) {
      debug(
        'renderer process - skipping migrations which have already been run'
      );
      return done();
    }
    const migrations = {
      '1.20.0-beta.0': require('./1.20.0-beta.0'),
      '1.21.0-beta.0': require('./1.21.0'),
      '1.21.0-dev.0': require('./1.21.0'),
    };
    const migrate = require('app-migrations')(migrations);
    migrate(previousVersion, currentVersion, function (err2, res) {
      if (err2) {
        debug('error', err2);
        return done(err2);
      }
      debug('result', res);
      done();
    });
  });
};
