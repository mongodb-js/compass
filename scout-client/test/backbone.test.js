var assert = require('assert'),
  helpers = require('./helpers'),
  Mackbone = require('../').adapters.Backbone,
  Backbone = require('backbone');

describe.skip('Backbone', function() {
  var Model, Collection;

  before(function(done) {
    helpers.createClient()
    .on('error', done)
    .on('readable', function() {
      Collection = Backbone.Collection.extend(Mackbone.Collection);
      Model = Backbone.Model.extend(Mackbone.Model);
      done();
    });
  });
  after(helpers.after.bind(this));

  describe('Model', function() {
    it('should provide a model', function() {
      assert(Mackbone.Model);
      assert(Mackbone.Model.sync);
    });
  });
  describe('Collection', function() {
    it('should provide a collection', function() {
      assert(Mackbone.Collection);
      assert(Mackbone.Collection.sync);
    });

    it('should pass options to find', function(done) {
      var Logs = Collection.extend({
        url: '/collections/local.startup_log/find'
      });
      var logs = new Logs();
      logs.fetch({
        limit: 1,
        error: function(model, err) {
          done(err);
        },
        success: function(model, res) {
          assert(Array.isArray(res));
          assert.equal(res.length, 1);
          done();
        }
      });
    });

    it('should fetch all', function(done) {
      var StartupLog = Collection.extend({
        url: '/collections/local.startup_log/find'
      });

      var starts = new StartupLog();

      function check() {
        var res = starts.toJSON();
        console.log('Starts', starts);
        assert(Array.isArray(res), 'Not an array?');
        assert(res.length >= 1, 'Empty results');
        done();
      }

      starts.fetch({
        all: true,
        error: function(model, err) {
          done(err);
        },
        success: check
      });
    });
  });
});
