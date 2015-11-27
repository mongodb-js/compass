var assert = require('assert');
var debug = require('debug')('app-preferences:test:model');
var localforage = require('localforage');

var Preference = require('../lib');
// var PreferenceCollection = require('../lib').Collection;

describe('Preference', function() {
  describe('Model', function() {
    it('should have correct default values', function() {
      var pref = new Preference({
        key: 'enable stealth mode'
      });
      assert.equal(pref.value, undefined);
      assert.equal(pref.resetOnAppLaunch, true);
      assert.equal(pref.resetOnAppVersionChange, true);
      assert.equal(pref.section, 'General');
      assert.equal(pref.storage, 'memory');
      assert.equal(pref.hidden, false);
    });

    it('should not allow invalid storage layers', function() {
      assert.throws(function() {
        /* eslint no-unused-vars: 0 */
        var pref = new Preference({
          key: 'enable stealth mode',
          value: true,
          storage: 'cloud'
        });
      }, /must be one of/);
    });

    it('should check for incompatible storage layers', function() {
      assert.throws(function() {
        /* eslint no-unused-vars: 0 */
        var pref = new Preference({
          key: 'enable stealth mode',
          value: true,
          resetOnAppLaunch: false,
          storage: 'memory'
        });
      }, /not possible/);
    });
  });

  describe('Storage', function() {
    it('should work with `local` storage layer', function(done) {
      var pref = new Preference({
        key: 'enable stealth mode',
        value: 'with jetpacks',
        storage: 'local'
      });
      pref.save('value', 'with jetpacks', {
        wait: false,
        success: function(val) {
          pref = new Preference({
            key: 'enable stealth mode',
            storage: 'local'
          });
          pref.fetch({
            success: function(model) {
              debug('value:', model.value);
              if (model.value !== 'with jetpacks') {
                return done(new Error('value incorrect'));
              }
              return done();
            },
            failure: function(err) {
              return done(err);
            }
          });
        },
        failure: function(err) {
          done(err);
        }
      });
    });
  });
});
