var storageMixin = require('../lib');

var Model = require('ampersand-model');
var Collection = require('ampersand-rest-collection');

var assert = require('assert');
var format = require('util').format;
var async = require('async');

var backends = require('../lib/backends');

var debug = require('debug')('storage-mixin:test');

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

describe('storage-mixin', function() {
  Object.keys(backends).forEach(function(backendName) {
    if (backendName === 'null') {
      return;
    }
    describe(format('storage backend `%s`', backendName), function() {
      // clear namespaces of this backend before and after the tests
      before(function(done) {
        var tasks = ['Spaceships', 'Planets'].map(function(name) {
          return backends[backendName].clear.bind(name);
        });
        async.parallel(tasks, done);
      });

      after(function(done) {
        var tasks = ['Spaceships', 'Planets'].map(function(name) {
          return backends[backendName].clear.bind(name);
        });
        async.parallel(tasks, done);
      });

      var StorableSpaceship;
      var StorableFleet;

      // create storable classes with this backend
      before(function() {
        StorableSpaceship = Spaceship.extend(storageMixin, {
          storage: {
            backend: backendName
            /* otherwise use default options here */
          }
        });
        StorableFleet = Fleet.extend(storageMixin, {
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
            otherSpaceship.on('sync', function() {
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

      it('should work with collections', function(done) {
        fleet.on('sync', function() {
          debug('fleet:', fleet.toJSON());
          assert.equal(fleet.length, 2);
          done();
        });
        fleet.fetch();
      });

      it('should remove correctly', function(done) {
        spaceship.destroy({
          success: function() {
            fleet.on('sync', function() {
              debug('fleet:', fleet.toJSON());
              assert.equal(fleet.length, 1);
              done();
            });
            fleet.fetch();
          },
          error: done
        });
      });
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
});
