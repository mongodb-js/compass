var storageMixin = require('../lib');
var assert = require('assert');
var helpers = require('./helpers');

describe('storage backend secure', function() {
  var backendOptions = 'secure';

  var StorableSpaceship;
  var StorableFleet;
  var StorablePlanet;
  var spaceship;
  var fleet;

  /**
   * Create storable classes with this backend
   */
  StorableSpaceship = helpers.Spaceship.extend(storageMixin, {
    storage: backendOptions
  });

  StorableFleet = helpers.Fleet.extend(storageMixin, {
    model: StorableSpaceship,
    storage: backendOptions
  });

  StorablePlanet = helpers.Planet.extend(storageMixin, {
    storage: backendOptions
  });

  /**
   * Clear namespaces of this backend before and after the tests.
   */
  before(function(done) {
    helpers.clearNamespaces('secure', ['Spaceships', 'Planets'], done);
  });

  after(function(done) {
    helpers.clearNamespaces('secure', ['Spaceships', 'Planets'], done);
  });

  after(function(done) {
    fleet = new StorableFleet();
    fleet.once('sync', function() {
      assert.equal(fleet.length, 0);
      done();
    });
    fleet.fetch();
  });

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
    spaceship.save(
      { warpSpeed: 3.14 },
      {
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
        error: function(res, err) {
          done(err);
        }
      }
    );
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
    var earth = new StorablePlanet({
      name: 'Earth',
      population: 7000000000
    });

    earth.save(null, {
      success: done.bind(null, null),
      error: done
    });
  });

  it('should use the correct appName/namespace key for the native credential entry', function(done) {
    var keytar = require('keytar');
    helpers.clearNamespaces('secure', ['Spaceships', 'Planets'], function(err) {
      if (err) {
        done(err);
      }
      var earth = new StorablePlanet({
        name: 'Earth',
        population: 7000000000
      });
      earth.save(null, {
        success: function() {
          // Check that save properly wrote to the keychain
          return keytar
            .findPassword('storage-mixin/Planets')
            .then(function(rawJsonString) {
              assert.strictEqual(
                rawJsonString,
                '{"name":"Earth","population":7000000000}'
              );
              done();
            })
            .catch(done);
        }
      });
    });
  });

  // secure backend doesn't support fetching all keys of a namespace/service.
  it.skip('should create a new model in a collection');
  it.skip('should fetch collections');
  it.skip('should remove correctly');
});
