const pkg = require('../../../package.json');
const Model = require('ampersand-model');
const storageMixin = require('storage-mixin');
const electronApp = require('electron').app;

const migrations = {
  '1.2.0-beta.1': require('./1.2.0')
};

const migrate = require('app-migrations')(migrations);

const debug = require('debug')('mongodb-compass:main:migrations');

function getPreviousVersion(done) {
  const DiskPrefModel = Model.extend(storageMixin, {
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
    migrate(previousVersion, currentVersion, done);
  });
};
