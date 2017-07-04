/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');

const {
  ARRAY_REDUCTION_TYPES
} = require('../../src/internal-packages/chart/lib/constants');

const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const AggPipelineBuilder = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');

// const debug = require('debug')('mongodb-compass:charts:test:array-reduction');

const DB = 'test_agg_pipeline_builder';

/**
 * Global connection model for this test.
 */
const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  ns: DB,
  port: 27018
});

const aggBuilder = new AggPipelineBuilder();

describe('Aggregation Pipeline Builder', function() {
  const dataService = new DataService(CONNECTION);

  after(function(done) {
    dataService.dropDatabase(DB, function() {
      dataService.disconnect();
      done();
    });
  });

  context('on the "array_numbers" collection', function() {
    before(function(done) {
      dataService.connect(function() {
        const docs = [
          {_id: 0, prices: [ 13.5, 16.9, 21.5, 8.0, 2.7, 22.1 ]},
          {_id: 1, prices: [ 3.4, 9.1, 13.6, 7.0 ]}
        ];
        dataService.insertMany(`${DB}.array_numbers`, docs, {}, done);
      });
    });

    context('when encoding two different channels with the same field', function() {
      const state = {
        reductions: {
          x: [{field: 'prices', type: ARRAY_REDUCTION_TYPES.MIN}],
          y: [{field: 'prices', type: ARRAY_REDUCTION_TYPES.MAX}]
        },
        channels: {
          x: {field: 'prices', type: 'quantitative'},
          y: {field: 'prices', type: 'quantitative'}
        }
      };
      it('builds the correct agg pipeline', function() {
        const pipeline = aggBuilder.constructPipeline(state);
        expect(pipeline).to.be.an('array');
        expect(pipeline).to.have.lengthOf(3);
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            __alias_0: {
              $min: '$prices'
            }
          }
        });
        expect(pipeline[1]).to.be.deep.equal({
          $addFields: {
            __alias_1: {
              $max: '$prices'
            }
          }
        });
        expect(pipeline[2]).to.be.deep.equal({
          $project: {
            _id: 0,
            x: '$__alias_0',
            y: '$__alias_1'
          }
        });
      });
      it('returns the correct results when executing the pipeline', function(done) {
        const pipeline = aggBuilder.constructPipeline(state);
        dataService.aggregate(`${DB}.array_numbers`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res[0]).to.be.deep.equal({
            x: 2.7,
            y: 22.1
          });
          expect(res[1]).to.be.deep.equal({
            x: 3.4,
            y: 13.6
          });
          done();
        });
      });
    });
  });

  context('on the "array_subdoc_array" collection', function() {
    before(function(done) {
      dataService.connect(function() {
        const docs = [
          {_id: 0, friends: [ {scores: [ 5, 9, 14 ] }, {scores: [3, 1, 4] } ]},
          {_id: 1, friends: [ {scores: [ 15, 2, 7 ] }, {scores: [-3, 91, 6] } ]}
        ];
        dataService.insertMany(`${DB}.array_subdoc_array`, docs, {}, done);
      });
    });

    it('the collection has 2 documents', function(done) {
      dataService.count(`${DB}.array_subdoc_array`, {}, {}, function(err, res) {
        expect(err).to.be.null;
        expect(res).to.be.equal(2);
        done();
      });
    });

    context('when using two accumulating reductions', function() {
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

      it('builds the correct agg pipeline with two accumulating reductions', function() {
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
        dataService.aggregate(`${DB}.array_subdoc_array`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(2);
          expect(res[0].x).to.be.equal(5);
          expect(res[1].x).to.be.equal(2);
          done();
        });
      });
    });
  });
});
