var backends = require('../lib/backends');
var Model = require('ampersand-model');
var Collection = require('ampersand-rest-collection');
var async = require('async');
var keytar;
try {
  keytar = require('keytar');
} catch (e) {
  keytar = null;
}

var debug = require('debug')('storage-mixin:test:helpers');

/**
 * Helper to clear all given namespaces for a backend.
 * @param  {String}   backendName   name of the backend, e.g. `local`
 * @param  {Array}   namespaces     array of namespace strings
 * @param  {Function} done          errback
 */
var clearNamespaces = function(backendName, namespaces, done) {
  var tasks = namespaces.map(function(namespace) {
    return backends[backendName].clear.bind(null, namespace);
  });
  async.parallel(tasks, done);
};

/**
 * Monkey-patch the secure clear method for testing because keytar doesn't
 * suport clearing the entire namespace automatically. Deletes all keys
 * that are used in the tests.
 */
if (keytar) {
  backends.secure.clear = function(namespace, done) {
    debug('monkey patched clear.');
    var prefix = 'storage-mixin/';
    if (namespace === 'Spaceships') {
      keytar.deletePassword(prefix + 'Spaceships', 'Heart of Gold');
      keytar.deletePassword(prefix + 'Spaceships', 'Serenity');
      keytar.deletePassword(prefix + 'Spaceships', 'Battlestar Galactica');
    } else if (namespace === 'Planets') {
      keytar.deletePassword(prefix + 'Planets', 'Earth');
    } else if (namespace === 'Users') {
      keytar.deletePassword(prefix + 'Users', 'apollo');
    }
    done();
  };
}

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

module.exports = {
  keytarAvailable: !!keytar,
  clearNamespaces: clearNamespaces,
  Spaceship: Spaceship,
  Fleet: Fleet,
  Planet: Planet,
  User: User,
  Users: Users
};
