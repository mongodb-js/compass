var storageMixin = require('../lib');
var SecureBackend = require('../lib/backends').secure;
var SpliceDiskBackend = require('../lib/backends')['splice-disk'];
var wrapErrback = require('../lib/backends/errback').wrapErrback;
var helpers = require('./helpers');
var assert = require('assert');
var async = require('async');
var debug = require('debug')('storage-mixin:splice:test');

describe('storage backend splice-disk', function() {
  var backendOptions = {
    backend: 'splice-disk',
    basepath: '.',
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
    helpers.clearNamespaces(
      'splice-disk',
      ['Spaceships', 'Planets', 'Users'],
      done
    );
  });

  after(function(done) {
    helpers.clearNamespaces(
      'splice-disk',
      ['Spaceships', 'Planets', 'Users'],
      done
    );
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
    if (SpliceDiskBackend.isNullBackend) {
      this.skip();
    }
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
        error: done
      }
    );
  });

  it('should store a second model in the same namespace', function(done) {
    if (SpliceDiskBackend.isNullBackend) {
      this.skip();
    }
    var secondSpaceship = new StorableSpaceship({
      name: 'Heart of Gold'
    });
    secondSpaceship.save(null, {
      success: done.bind(null, null),
      error: done
    });
  });

  it('should store a model in a different namespace', function(done) {
    if (SpliceDiskBackend.isNullBackend) {
      this.skip();
    }
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
    if (SpliceDiskBackend.isNullBackend) {
      this.skip();
    }
    fleet.once('sync', function() {
      done();
    });
    fleet.create({
      name: 'Serenity',
      enableJetpack: true
    });
  });

  it('should remove correctly', function(done) {
    if (SpliceDiskBackend.isNullBackend) {
      this.skip();
    }
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
      if (SpliceDiskBackend.isNullBackend) {
        this.skip();
      }
      user.save(
        { password: 'foobar' },
        {
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
        }
      );
    });

    it('should not store the password in `disk` backend', function(done) {
      if (SpliceDiskBackend.isNullBackend) {
        this.skip();
      }

      user.save(
        null,
        wrapErrback(function(err, res) {
          if (err) {
            return done(err);
          }
          user._storageBackend.diskBackend.exec(
            'read',
            'apollo',
            wrapErrback(function(err2, stored) {
              if (err2) {
                return done(err2);
              }
              assert.ok(stored.id);
              assert.ok(stored.name);
              assert.ok(stored.email);
              assert.equal(stored.password, undefined);
              done(null, res);
            })
          );
        })
      );
    });

    it('should only store the password in `secure` backend', function(done) {
      if (SpliceDiskBackend.isNullBackend) {
        this.skip();
      }
      user.save(
        null,
        wrapErrback(function(err, res) {
          if (err) {
            return done(err);
          }
          user._storageBackend.secureBackend.exec(
            'read',
            'apollo',
            wrapErrback(function(err2, stored) {
              if (err2) {
                return done(err2);
              }
              assert.ok(stored.password);
              assert.equal(stored.id, undefined);
              assert.equal(stored.name, undefined);
              assert.equal(stored.email, undefined);
              done(null, res);
            })
          );
        })
      );
    });

    it('should fetch collections', function(done) {
      if (SpliceDiskBackend.isNullBackend) {
        this.skip();
      }
      var users = new StorableUsers();
      users.once('sync', function() {
        debug('fetch collections', users.serialize());
        assert.equal(users.length, 1);
        if (!SecureBackend.isNullBackend) {
          assert.equal(
            users.at(0).password,
            SecureBackend.isNullBackend ? '' : 'cyl0nHunt3r'
          );
        }
        done();
      });
      users.fetch();
    });

    it('should work with custom collection sort orders', function(done) {
      if (SpliceDiskBackend.isNullBackend) {
        this.skip();
      }
      var SortedUsers = helpers.Users.extend(storageMixin, {
        model: StorableUser,
        storage: backendOptions,
        comparator: 'name'
      });
      var users = new SortedUsers();
      async.series(
        [
          function(cb) {
            users.create(
              {
                id: 'apollo',
                name: 'Lee Adama',
                email: 'apollo@galactica.com',
                password: 'cyl0nHunt3r'
              },
              {
                success: function(res) {
                  cb(null, res);
                },
                error: done
              }
            );
          },
          function(cb) {
            users.create(
              {
                id: 'starbuck',
                name: 'Kara Thrace',
                email: 'kara@galactica.com',
                password: 'caprica'
              },
              {
                success: function(res) {
                  cb(null, res);
                },
                error: done
              }
            );
          }
        ],
        function() {
          users = new SortedUsers();
          users.on('sync', function() {
            debug('users', users.serialize());
            assert.equal(users.get('apollo').password, 'cyl0nHunt3r');
            assert.equal(users.get('starbuck').password, 'caprica');
            done();
          });
          users.fetch();
        }
      );
    });
  });
});
