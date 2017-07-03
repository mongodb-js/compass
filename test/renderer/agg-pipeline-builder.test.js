/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
// const aggBuilder = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');

const {
  ARRAY_REDUCTION_TYPES
} = require('../../src/internal-packages/chart/lib/constants');

const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const AggPipelineBuilder = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');

// const debug = require('debug')('mongodb-compass:charts:test:array-reduction');

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  ns: 'test',
  port: 27018
});

const aggBuilder = new AggPipelineBuilder();

describe('Aggregation Pipeline Builder', function() {
  context('when on test.array_subdoc_array collection', function() {
    const dataService = new DataService(CONNECTION);

    before(function(done) {
      dataService.connect(function() {
        const docs = [
          {_id: 0, friends: [ {scores: [ 5, 9, 14 ] }, {scores: [3, 1, 4] } ]},
          {_id: 1, friends: [ {scores: [ 15, 2, 7 ] }, {scores: [-3, 91, 6] } ]}
        ];
        dataService.insertMany('test.array_subdoc_array', docs, {}, done);
      });
    });

    after(function(done) {
      dataService.dropDatabase('test', function() {
        dataService.disconnect();
        done();
      });
    });

    it('the collection has 2 documents', function(done) {
      dataService.count('test.array_subdoc_array', {}, {}, function(err, res) {
        expect(err).to.be.null;
        expect(res).to.be.equal(2);
        done();
      });
    });

    it('builds the correct agg pipeline with two accumulating reductions', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.MAX},
            {field: 'friends.scores', type: ARRAY_REDUCTION_TYPES.MIN}
          ]
        },
        channels: {
          x: { field: 'friends.scores', type: 'quantitative' }
        }
      };
      const pipeline = aggBuilder.constructPipeline(state);
      expect(pipeline).to.be.an('array');
      expect(pipeline[0]).to.be.deep.equal({
        $addFields: {
          '__alias_0': {
            $max: {
              $map: {
                input: '$friends',
                as: 'value',
                in: {
                  $min: '$$value.scores'
                }
              }
            }
          }
        }
      });
    });

    it('returns the correct results when executing the pipeline', function(done) {
      const state = {
        reductions: {
          x: [
            { field: 'friends', type: ARRAY_REDUCTION_TYPES.MAX },
            { field: 'friends.scores', type: ARRAY_REDUCTION_TYPES.MIN }
          ]
        },
        channels: {
          x: { field: 'friends.scores', type: 'quantitative' }
        }
      };
      const pipeline = aggBuilder.constructPipeline(state);
      dataService.aggregate('test.array_subdoc_array', pipeline, {}, function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.lengthOf(2);
        expect(res[0].x).to.be.equal(5);
        expect(res[1].x).to.be.equal(2);
        done();
      });
    });

    it('returns the correct results when executing the pipeline', function(done) {
      const state = {
        reductions: {
          x: [
            { field: 'friends', type: ARRAY_REDUCTION_TYPES.MAX },
            { field: 'friends.scores', type: ARRAY_REDUCTION_TYPES.MIN }
          ]
        },
        channels: {
          x: { field: 'friends.scores', type: 'quantitative' }
        }
      };
      const pipeline = aggBuilder.constructPipeline(state);
      dataService.aggregate('test.array_subdoc_array', pipeline, {}, function(err, res) {
        expect(err).to.be.null;
        expect(res).to.have.lengthOf(2);
        expect(res[0].x).to.be.equal(5);
        expect(res[1].x).to.be.equal(2);
        done();
      });
    });
  });
});
