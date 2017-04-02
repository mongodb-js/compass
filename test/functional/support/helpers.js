const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const pkg = require('../../../package.json');
// const debug = require('debug')('mongodb-compass:test:functional-helpers');

const PREF_DATA_DIR = path.join(__dirname, '..', '..', '..', '.user-data', 'AppPreferences');
const PREF_FILE_PATH = path.join(PREF_DATA_DIR, 'General.json');

function skipTourAndNetworkOptin(done) {
  mkdirp(PREF_DATA_DIR, function(err) {
    if (err) throw err;
    const content = {
      lastKnownVersion: pkg.version,
      showedNetworkOptIn: true,
      currentUserId: 'thomas'
    };
    fs.writeFile(PREF_FILE_PATH, JSON.stringify(content), {encoding: 'utf8'}, done);
  });
}

module.exports = {
  skipTourAndNetworkOptin: skipTourAndNetworkOptin
};
