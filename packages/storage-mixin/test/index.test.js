var storageMixin = require('../lib');

var Model = require('ampersand-model');
var assert = require('assert');
var format = require('util').format;

var backends = require('../lib/backends');

// var debug = require('debug')('storage-mixin:test');

var Spaceship = Model.extend({
  idAttribute: 'name',
  namespace: 'Spaceship',
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

describe('storage-mixin', function() {
  Object.keys(backends).forEach(function(backendName) {
    describe(format('storage backend `%s`', backendName), function() {
      // clear namespace of this backend before the tests
      before(function(done) {
        var backend = new backends[backendName]({
          namespace: 'Spaceship'
        });
        backend.clear(done);
      });

      var StorableSpaceship;
      var spaceship;

      // create a storable class with this backend
      before(function() {
        StorableSpaceship = Spaceship.extend(storageMixin, {
          storage: {
            backend: backendName
            /* otherwise use default options here */
          }
        });
      });

      beforeEach(function() {
        // instantiate a model of the storable class
        spaceship = new StorableSpaceship({
          name: 'Battlestar Galactica',
          enableJetpacks: true,
          warpSpeed: 1
        });
      });
      it('should save and fetch correctly', function(done) {
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
    });
  });
});
