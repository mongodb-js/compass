var storageMixin = require('../lib');
var backends = require('../lib/backends');

var Model = require('ampersand-model');
var Collection = require('ampersand-rest-collection');

var assert = require('assert');
var format = require('util').format;
var async = require('async');
var keytar = require('keytar');
var fs = require('fs');


// var debug = require('debug')('storage-mixin:test');

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


/**
 * Monkey-patch the secure clear method for testing
 */
backends.secure.clear = function(namespace, done) {
  // delete the specific keys that we're using here in this test
  var prefix = 'storage-mixin/';
  if (namespace === 'Spaceships') {
    keytar.deletePassword(prefix + 'Spaceships', 'Heart of Gold');
    keytar.deletePassword(prefix + 'Spaceships', 'Serenity');
    keytar.deletePassword(prefix + 'Spaceships', 'Battlestar Galactica');
  } else if (namespace === 'Planets') {
    keytar.deletePassword(prefix + 'Planets', 'Earth');
  }
  done();
};

function clearNamespaces(backendName, namespaces, done) {
  var tasks = namespaces.map(function(name) {
    return backends[backendName].clear.bind(null, name);
  });
  async.parallel(tasks, done);
}

describe('storage-mixin', function() {
  Object.keys(backends).forEach(function(backendName) {
    if (['null', 'remote'].indexOf(backendName) !== -1) {
      // don't test remote or null backends here
      return;
    }
    describe(format('storage backend `%s`', backendName), function() {
      // clear namespaces of this backend before and after the tests
      before(function(done) {
        clearNamespaces(backendName, ['Spaceships', 'Planets'], done);
      });
      after(function(done) {
        clearNamespaces(backendName, ['Spaceships', 'Planets'], done);
      });

      var StorableSpaceship;
      var StorableFleet;

      // create storable classes with this backend
      before(function() {
        StorableSpaceship = Spaceship.extend(storageMixin, {
          // test with storage string
          storage: backendName
        });
        StorableFleet = Fleet.extend(storageMixin, {
          model: StorableSpaceship,
          // test with storage object
          storage: {
            backend: backendName
          }
        });
      });

      var spaceship;
      var fleet;
      beforeEach(function() {
        // instantiate a model of the storable class
        spaceship = new StorableSpaceship({
          name: 'Battlestar Galactica',
          enableJetpacks: true,
          warpSpeed: 1
        });
        fleet = new StorableFleet();
      });
      it('should update and read correctly', function(done) {
        spaceship.save({warpSpeed: 3.14}, {
          success: function() {
            var otherSpaceship = new StorableSpaceship({
              name: 'Battlestar Galactica'
            });
            otherSpaceship.once('sync', function() {
              assert.equal(otherSpaceship.warpSpeed, 3.14);
              done();
            });
            otherSpaceship.fetch();
          },
          error: done
        });
      });

      it('should store a second model in the same namespace', function(done) {
        var secondSpaceship = new StorableSpaceship({
          name: 'Heart of Gold'
        });
        secondSpaceship.save(null, {
          success: done.bind(null, null),
          error: done
        });
      });

      it('should store a model in a different namespace', function(done) {
        var StorablePlanet = Model.extend(storageMixin, {
          idAttribute: 'name',
          namespace: 'Planets',
          storage: {
            backend: backendName
            /* otherwise use default options here */
          },
          props: {
            name: ['string', true, ''],
            population: ['number', true, 0]
          }
        });

        var earth = new StorablePlanet({
          name: 'Earth',
          population: 7000000000
        });

        earth.save(null, {
          success: done.bind(null, null),
          error: done
        });
      });

      it('should create a new model in a collection', function(done) {
        fleet.once('sync', function() {
          done();
        });
        fleet.create({
          name: 'Serenity',
          enableJetpack: true
        });
      });

      /**
       * the next 2 tests don't work for the secure backend, only test
       * for the other backends.
       */
      if (backendName !== 'secure') {
        it('should fetch collections', function(done) {
          fleet.once('sync', function() {
            assert.equal(fleet.length, 3);
            done();
          });
          fleet.fetch();
        });

        it('should remove correctly', function(done) {
          spaceship.destroy({
            success: function() {
              fleet.once('sync', function() {
                assert.equal(fleet.length, 2);
                done();
              });
              fleet.fetch();
            },
            error: done
          });
        });
      }
    });
  });

  describe('storage backend `null`', function() {
    var NullSpaceship;

    before(function() {
      NullSpaceship = Spaceship.extend(storageMixin, {
        storage: {
          backend: 'null'
        }
      });
    });

    var spaceship;
    beforeEach(function() {
      spaceship = new NullSpaceship();
    });

    it('should call remove without errors', function(done) {
      spaceship.destroy({
        success: done.bind(null, null),
        error: done
      });
    });

    it('should call update without errors', function(done) {
      spaceship.save({warpSpeed: -10}, {
        success: done.bind(null, null),
        error: done
      });
    });

    it('should call read without errors', function(done) {
      spaceship = new NullSpaceship();
      spaceship.fetch({
        success: function(res) {
          // back to default value
          assert.equal(res.warpSpeed, 1);
          done();
        },
        error: done
      });
    });
  });

  it('should not leave any orphaned directories after tests', function(done) {
    async.some(['./Planets', './Spaceships'], fs.exists, function(result) {
      // if result is true then at least one of the files exists
      if (result) {
        return done(new Error('orphaned files left after tests.'));
      }
      done();
    });
  });
});
