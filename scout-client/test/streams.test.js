var assert = require('assert'),
  helpers = require('./helpers'),
  datasets = require('mongodb-datasets'),
  debug = require('debug')('mongoscope-client:test:streams');

describe.skip('Streams', function() {
  before(helpers.before.bind(this));
  after(helpers.after.bind(this));

  it('should be using websockets or polling', function() {
    assert(['websocket', 'polling'].indexOf(helpers.client.io.io.engine.transport.name) > -1);
  });

  it('should not allow streaming count (for now)', function() {
    assert.throws(function() {
      helpers.client.count('local.startup_log');
    }, new RegExp('not streamable'));
  });

  it('should have a working cursor', function(done) {
    var seen = 0, expected;
    helpers.client.count('local.startup_log', function(err, res) {
      assert.ifError(err);
      expected = res.count;

      helpers.client.find('local.startup_log')
      .on('error', function(err) {
        console.error(err);
        done(err);
      })
      .on('data', function() {
        seen++;
      })
      .on('end', function() {
        assert.equal(seen, expected,
        'Count says ' + expected + ' but only saw ' + seen);
        done();
      });
    });
  });
  // it.skip('should allow streaming top #slow', function(done) {
  //   helpers.client.top({
  //     interval: 10
  //   })
  //   .on('error', done)
  //   .on('data', function(data) {
  //     assert(Array.isArray(data.namespaces));
  //     assert.equal(Object.prototype.toString.call(data.deltas), '[object Object]');
  //
  //     done();
  //   });
  // });

  describe('createWriteStream()', function() {
    var dest;
    before(function(done) {
      helpers.before.call(this, function() {
        dest = helpers.client.collection('test.bulky');
        done();
      });
    });
    after(function(done) {
      if (!dest) return done();

      dest.destroy(function() {
        done();
      });
    });

    it('should support a batchSize option', function(done) {
      var committed = 0, bulk;

      bulk = dest.createWriteStream({
        batchSize: 50
      })
      .on('flush', function(res) {
        debug('%d flushed', res.inserted_count);
        committed += res.inserted_count;
      })
      .on('error', done)
      .on('end', function() {
        assert.equal(committed, 50);
        done();
      });
      datasets(50, {
        n: '{{chance.d10()}}'
      }).pipe(bulk);
    });

    it('should insert all docs if #docs < batchSize', function(done) {
      var complete = false;
      datasets(10, {
        n: '{{chance.d10()}}'
      })
      .pipe(dest.createWriteStream({
        batchSize: 100
      }).on('end', function() {
        if (complete) return done(new Error('Got end event more than once!'));
        return (complete = true) && done();
      }).on('flush', function(res) {
        assert.equal(res.inserted_count, 10, 'inserted all 10 documents');
      }));
    });
  });
});
