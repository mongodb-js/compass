var localforage = require('localforage');
var storageMixin = require('../lib');
var Model = require('ampersand-model');

// var debug = require('debug')('storage-mixin:test');

var Preferences = Model.extend(storageMixin, {
  idAttribute: 'id',
  props: {
    id: {
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

/**
 * global before hook: always clear local storage
 */
before(function(done) {
  localforage.clear(done);
});

describe('Storage Layer `local`', function() {
  var preferences;

  beforeEach(function() {
    preferences = new Preferences({
      id: 'User Settings',
      enableJetpack: true,
      warpSpeed: 9.9
    });
  });

  it('should correctly save', function(done) {
    preferences.save(null, {
      success: function() {
        new Preferences({
          id: 'User Settings'
        }).fetch({
          success: function(res) {
            if (res.warpSpeed !== 9.9) {
              return done(new Error('invalid value'));
            }
            done();
          },
          error: done
        });
      },
      error: done
    });
  });
});
