/* eslint no-console:0 */
var assert = require('assert');
var Connection = require('../model');
var connect = require('../connect');
var Instance = require('mongodb-instance-model');

var shouldGetInstanceDetails = function(db, done) {
  assert(db);
  Instance.fetch(db, done);
};

var format = require('util').format;
var data = require('mongodb-connection-fixture');

describe('mongodb-connection#connect', function() {
  describe('local', function() {
    before(require('mongodb-runner/mocha/before')());
    it('should connect to `localhost:27017`', function(done) {
      var model = Connection.from('mongodb://localhost:27017');
      connect(model, function(err, _db) {
        if (err) {
          return done(err);
        }
        shouldGetInstanceDetails(_db, done);
      });
    });
  });

  describe('cloud #slow', function() {
    data.MATRIX.map(function(d) {
      it(format('should connect to `%s`', d.name), function(done) {
        this.slow(5000);
        this.timeout(10000);

        connect(d, function(err, _db) {
          if (err) {
            return done(err);
          }
          _db.close();
          done();
        });
      });
    });
  });
});
