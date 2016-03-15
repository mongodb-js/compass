var pkg = require('../../../package.json');
var Model = require('ampersand-model');
var storageMixin = require('storage-mixin');

var debug = require('debug')('mongodb-compass:migrations:index');

var migrations = {
  '1.1.2': require('./1.1.2')
};

var migrate = require('app-migrations')(migrations);

function getPreviousVersion(done) {
  var MiniPrefModel = Model.extend(storageMixin, {
    extraProperties: 'ignore',
    idAttribute: 'id',
    namespace: 'Preferences',
    storage: {
      backend: 'local',
      appName: pkg.product_name
    },
    props: {
      id: ['string', true, 'General'],
      lastKnownVersion: ['string', false, '']
    }
  });

  var miniPrefs = new MiniPrefModel();
  miniPrefs.once('sync', function(ret) {
    done(null, ret.lastKnownVersion || '0.0.0');
  });
  miniPrefs.fetch();
}

module.exports = function(done) {
  getPreviousVersion(function(err, previousVersion) {
    if (err) {
      done(err);
    }
    // strip any prerelease parts off
    previousVersion = previousVersion.split('-')[0];
    var currentVersion = pkg.version.split('-')[0];
    migrate(previousVersion, currentVersion, done);
  });
};
