var pkg = require('../../../package.json');
var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');
var electronApp = require('electron').remote.app;

var migrations = {
  '1.1.2': require('./1.1.2'),
  '1.2.0': require('./1.2.0'),
  '1.3.0-beta.0': require('./1.3.0-beta.0'),
  '1.3.0-beta.1': require('./1.3.0-beta.1')
};

var migrate = require('app-migrations')(migrations);

var debug = require('debug')('mongodb-compass:migrations');

function getPreviousVersion(done) {
  var DiskPrefModel = Model.extend(storageMixin, {
    extraProperties: 'ignore',
    idAttribute: 'id',
    namespace: 'AppPreferences',
    storage: {
      backend: 'disk',
      basepath: electronApp.getPath('userData')
    },
    props: {
      id: ['string', true, 'General'],
      lastKnownVersion: ['string', false, '']
    }
  });

  var IndexedDBPrefModel = DiskPrefModel.extend({
    namespace: 'Preferences',
    storage: {
      backend: 'local',
      appName: pkg.productName
    }
  });

  // first try to get previous version from disk-backed (JSON) model
  var diskPrefs = new DiskPrefModel();
  diskPrefs.once('sync', function(ret) {
    if (ret.lastKnownVersion) {
      return done(null, ret.lastKnownVersion);
    }
    // if that is not present, try IndexedDB-backed model (pre-1.2.0)
    var indexedDBPrefs = new IndexedDBPrefModel();
    indexedDBPrefs.once('sync', function(ret2) {
      // return version, or 0.0.0 if no version present
      return done(null, ret2.lastKnownVersion || '0.0.0');
    });
    indexedDBPrefs.fetch();
  });
  diskPrefs.fetch();
}

module.exports = function(done) {
  getPreviousVersion(function(err, previousVersion) {
    if (err) {
      done(err);
    }
    var currentVersion = pkg.version;
    debug('renderer process migrations from %s to %s', previousVersion, currentVersion);
    migrate(previousVersion, currentVersion, done);
  });
};
