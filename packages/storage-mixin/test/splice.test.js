var storageMixin = require('../lib');

var wrapErrback = require('../lib/backends/errback').wrapErrback;
var helpers = require('./helpers');
var assert = require('assert');

var debug = require('debug')('storage-mixin:splice:test');

describe('storage backend `splice`', function() {
  var backendOptions = {
    backend: 'splice',
    secureCondition: function(val, key) {
      return key.match(/password/);
    }
  };

  var StorableSpaceship;
  var StorableFleet;
  var StorablePlanet;
  var StorableUser;
  var StorableUsers;
  var spaceship;
  var fleet;

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

  StorableUser = helpers.User.extend(storageMixin, {
    storage: backendOptions
  });

  StorableUsers = helpers.Users.extend(storageMixin, {
    model: StorableUser,
    storage: backendOptions
  });

  // clear namespaces of this backend before and after the tests
  before(function(done) {
    helpers.clearNamespaces('splice', ['Spaceships', 'Planets', 'Users'], done);
  });

  after(function(done) {
    helpers.clearNamespaces('splice', ['Spaceships', 'Planets', 'Users'], done);
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
    var earth = new StorablePlanet({
      name: 'Earth',
      population: 7000000000
    });

    earth.save(null, {
      success: done.bind(null, null),
      error: done
    });
  });

  // secure backend doesn't support fetching all keys of a namespace/service.
  it.skip('should create a new model in a collection');
  it.skip('should remove correctly');


  describe('splitting and combining models', function() {
    var user;
    beforeEach(function() {
      user = new StorableUser({
        id: 'apollo',
        name: 'Lee Adama',
        email: 'apollo@galactica.com',
        password: 'cyl0nHunt3r'
      });
    });

    it('should split and combine a model correctly', function(done) {
      user.save({password: 'foobar'}, {
        success: function() {
          var sameUser = new StorableUser({
            id: 'apollo'
          });
          sameUser.once('sync', function() {
            assert.equal(sameUser.password, 'foobar');
            done();
          });
          sameUser.fetch();
        },
        error: done
      });
    });

    it('should not store the password in `local` backend', function(done) {
      user.save(null, wrapErrback(function(err, res) {
        if (err) {
          return done(err);
        }
        user._storageBackend.localBackend.exec('read', 'apollo', wrapErrback(function(err2, stored) {
          if (err2) {
            return done(err2);
          }
          assert.ok(stored.id);
          assert.ok(stored.name);
          assert.ok(stored.email);
          assert.equal(stored.password, undefined);
          done(null, res);
        }));
      }));
    });

    it('should only store the password in `secure` backend', function(done) {
      user.save(null, wrapErrback(function(err, res) {
        if (err) {
          return done(err);
        }
        user._storageBackend.secureBackend.exec('read', 'apollo', wrapErrback(function(err2, stored) {
          if (err2) {
            return done(err2);
          }
          assert.ok(stored.password);
          assert.equal(stored.id, undefined);
          assert.equal(stored.name, undefined);
          assert.equal(stored.email, undefined);
          done(null, res);
        }));
      }));
    });

    it('should fetch collections', function(done) {
      var users = new StorableUsers();
      users.once('sync', function() {
        debug('fetch collections', users.serialize());
        assert.equal(users.length, 1);
        assert.equal(users.at(0).password, 'cyl0nHunt3r');
        done();
      });
      users.fetch();
    });
  });
});
