var pkg = require('../../../package.json');
var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');
var electronApp = require('electron').app;

var migrations = {
  '1.2.0': require('./1.2.0')
};

var migrate = require('app-migrations')(migrations);

var debug = require('debug')('mongodb-compass:main:migrations');

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

  // try to get previous version from disk-backed (JSON) model, else return 0.0.0
  var diskPrefs = new DiskPrefModel();
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
    var currentVersion = pkg.version;
    debug('main process migrations from %s to %s', previousVersion, currentVersion);
    migrate(previousVersion, currentVersion, done);
  });
};
