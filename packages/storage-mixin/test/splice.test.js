var storageMixin = require('../lib');

var Model = require('ampersand-model');
var wrapErrback = require('../lib/backends/errback').wrapErrback;
var localforage = require('localforage');
// var assert = require('assert');

var debug = require('debug')('storage-mixin:splice:test');


var User = Model.extend(storageMixin, {
  idAttribute: 'id',
  namespace: 'Users',
  storage: {
    backend: 'splice',
    secureCondition: function(val, key) {
      return key.match(/password/);
    }
  },
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

describe('splice backend', function() {
  var user;

  before(function() {
    localforage.config({
      driver: 'INDEXEDDB',
      name: 'storage-mixin',
      storeName: 'Users'
    });
  });

  beforeEach(function() {
    user = new User({
      id: 'apollo',
      name: 'Lee Adama',
      email: 'apollo@galactica.com',
      password: 'cyl0nHunt3r'
    });
    // SpliceBackend.clear('Users', done);
  });

  it('should not store the password in local', function(done) {
    user.save(null, wrapErrback(function(err, res) {
      if (err) {
        return done(err);
      }
      debug('here');
      user._storageBackend.exec('read', 'apollo', wrapErrback(function(err2, stored) {
        debug('there');
        if (err2) {
          debug('error', err2);
          return done(err2);
        }
        debug('stored in local', stored);
        done(null, res);
      }));
    }));
  });
});
