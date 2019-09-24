var assert = require('assert');
var mergeSpliceResults = require('../lib/backends/util').mergeSpliceResults;

describe('util', function() {
  describe('#mergeSpliceResults', function() {
    context('when the non secure results are an array', function() {
      var model = { isCollection: true, mainIndex: '_id' };
      var nonSecureResults = [
        { name: 'Aphex Twin', _id: 'at' },
        { name: 'Bonobo', _id: 'b' }
      ];
      var secureResults = [
        { _id: 'b', password: 'p' },
        { _id: 'at', password: 'a' }
      ];

      it('merges the results', function(done) {
        mergeSpliceResults(nonSecureResults, secureResults, model, (err, merged) => {
          assert.equal(err, null);
          assert.deepEqual(
            merged,
            [
              { name: 'Aphex Twin', _id: 'at', password: 'a' },
              { name: 'Bonobo', _id: 'b', password: 'p' }
            ]
          );
          done();
        })
      });
    });

    context('when the non secure results are an object', function() {
      var model = { isCollection: false };
      var nonSecureResults = { name: 'Aphex Twin' };
      var secureResults = { password: 'pw' };

      it('merges the results', function(done) {
        mergeSpliceResults(nonSecureResults, secureResults, model, (err, merged) => {
          assert.equal(err, null);
          assert.deepEqual(
            merged,
            { name: 'Aphex Twin', password: 'pw' }
          );
          done();
        })
      });
    });
  });
});
