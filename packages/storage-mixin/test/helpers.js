var backends = require('../lib/backends');
var Model = require('ampersand-model');
var Collection = require('ampersand-rest-collection');
var async = require('async');
// var debug = require('debug')('mongodb-storage-mixin:test:helpers');
const { execSync } = require('child_process');

/**
 * Helper to clear all given namespaces for a backend.
 * @param  {String}   backendName   name of the backend, e.g. `local`
 * @param  {Array}   namespaces     array of namespace strings
 * @param  {Function} done          errback
 */
var clearNamespaces = function(backendName, namespaces, done) {
  // debug('Clearing namespaces for backend %s', backendName, namespaces);
  var tasks = namespaces.map(function(namespace) {
    var backend = backends[backendName];
    return function(cb) {
      backend.clear(namespace, cb);
    };
  });
  async.parallel(tasks, function(err, res) {
    if (err) {
      // debug('Error clearing namespaces', err);
      return done(err);
    }
    // debug('Namespaces cleared for backend %s', backendName);
    done(err, res);
  });
};

var Spaceship = Model.extend({
  idAttribute: 'name',
  namespace: 'Spaceships',
  props: {
    name: {
      type: 'string',
      required: true
    },
    enableJetpack: {
      type: 'boolean',
      default: false,
      required: true
    },
    warpSpeed: {
      type: 'number',
      default: 1,
      required: true
    }
  }
});

var Fleet = Collection.extend({
  namespace: 'Spaceships',
  model: Spaceship
});

var Planet = Model.extend({
  idAttribute: 'name',
  namespace: 'Planets',
  props: {
    name: ['string', true, ''],
    population: ['number', true, 0]
  }
});

var User = Model.extend({
  idAttribute: 'id',
  namespace: 'Users',
  props: {
    id: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string',
      required: true
    },
    email: {
      type: 'string',
      required: true
    },
    password: {
      type: 'string',
      required: true
    }
  }
});

var Users = Collection.extend({
  namespace: 'Users',
  model: User
});

function getDefaultKeychain() {
  return execSync('security default-keychain', { encoding: 'utf8' }).trim();
}

// This should ensure that the tests that we are running against secure backend
// will be executed against unlocked keychain on macos
function createUnlockedKeychain() {
  if (process.platform === 'darwin') {
    const tempKeychainName = `temp${Date.now().toString(32)}.keychain`;
    const origDefaultKeychain = JSON.parse(getDefaultKeychain());

    return {
      name: tempKeychainName,
      before() {
        execSync(`security create-keychain -p "" "${tempKeychainName}"`);
        execSync(`security default-keychain -s "${tempKeychainName}"`);
        execSync(`security unlock-keychain -p "" "${tempKeychainName}"`);

        // debug(`Using temporary keychain ${getDefaultKeychain()}`);
      },
      after() {
        execSync(`security default-keychain -s "${origDefaultKeychain}"`);
        execSync(`security delete-keychain "${tempKeychainName}"`);

        // debug(
        //   `Switched back to original default keychain ${getDefaultKeychain()}`
        // );
      }
    };
  }

  return { name: null, before() {}, after() {} };
}

module.exports = {
  clearNamespaces,
  createUnlockedKeychain,
  Spaceship,
  Fleet,
  Planet,
  User,
  Users
};
