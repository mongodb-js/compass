/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');

const {
  ARRAY_REDUCTION_TYPES
} = require('../../src/internal-packages/chart/lib/constants');

const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const AggPipelineBuilder = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');
const semver = require('semver');

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
  let versionSupported = true;
  const dataService = new DataService(CONNECTION);

  /**
   * Check if the MongoDB version is high enough to support aggregation
   * tests. We need at least version 3.4 for $addFields support.
   *
   * Note: Due to a bug in mocha, we cannot skip all tests here, instead
   * we set `versionSupported` to false and skip them individually.
   *
   * @see https://github.com/mochajs/mocha/issues/2819
   */
  before(function(done) {
    dataService.connect(() => {
      dataService.command('admin', {buildInfo: 1}, (err, buildInfo) => {
        expect(err).to.be.null;
        if (semver.lt(buildInfo.version, '3.4.0')) {
          versionSupported = false;
        }
        done();
      });
    });
  });

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
        if (!versionSupported) {
          this.skip();
        }

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
        if (!versionSupported) {
          this.skip();
        }

        dataService.aggregate(`${DB}.array_subdoc_array`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(2);
          expect(res[0].x).to.be.equal(5);
          expect(res[1].x).to.be.equal(2);
          done();
        });
      });
    });

    context('when using mean accumlator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.MAX},
            {field: 'friends.scores', type: ARRAY_REDUCTION_TYPES.MEAN}
          ]
        },
        channels: {
          x: { field: 'friends.scores', type: 'quantitative' }
        }
      };
      const pipeline = aggBuilder.constructPipeline(state);

      it('builds the correct agg pipeline using the "mean" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $max: {
                $map: {
                  input: '$friends',
                  as: 'value',
                  in: {
                    $avg: '$$value.scores'
                  }
                }
              }
            }
          }
        });
      });

      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }

        dataService.aggregate(`${DB}.array_subdoc_array`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(2);
          expect(res[0].x).to.be.equal(9.333333333333334);
          expect(res[1].x).to.be.equal(31.333333333333332);
          done();
        });
      });
    });

    context('when using sum accumalator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.MAX},
            {field: 'friends.scores', type: ARRAY_REDUCTION_TYPES.SUM}
          ]
        },
        channels: {
          x: { field: 'friends.scores', type: 'quantitative' }
        }
      };
      const pipeline = aggBuilder.constructPipeline(state);

      it('builds the correct agg pipeline using the "sum" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $max: {
                $map: {
                  input: '$friends',
                  as: 'value',
                  in: {
                    $sum: '$$value.scores'
                  }
                }
              }
            }
          }
        });
      });

      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }

        dataService.aggregate(`${DB}.array_subdoc_array`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(2);
          expect(res[0].x).to.be.equal(28);
          expect(res[1].x).to.be.equal(94);
          done();
        });
      });
    });
  });

  context('On the "array_of_strings" collection ', function() {
    before(function(done) {
      dataService.connect(function() {
        const docs = [
          {_id: 0, friends: [ 'Tom', 'Jerry', 'Harry' ]},
          {_id: 1, friends: ['Justice', 'Courage', 'Temperance', 'Wisdom']},
          {_id: 2, friends: ['Pirates', 'Ninjas']}
        ];
        dataService.insertMany(`${DB}.array_of_strings`, docs, {}, done);
      });
    });

    it('the collection has 3 documents', function(done) {
      dataService.count(`${DB}.array_of_strings`, {}, {}, function(err, res) {
        expect(err).to.be.null;
        expect(res).to.be.equal(3);
        done();
      });
    });

    context('when using concat accumlator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.CONCAT}
          ]
        },
        channels: {
          x: { field: 'friends', type: 'ordinal' }
        }
      };
      const pipeline = aggBuilder.constructPipeline(state);

      it('builds the correct agg pipeline with the "concat" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $reduce: {
                in: {
                  $concat: ['$$value', '$$this']
                },
                initialValue: '',
                input: '$friends'
              }
            }
          }
        });
      });

      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }

        dataService.aggregate(`${DB}.array_of_strings`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(3);
          expect(res[0].x).to.be.equal('TomJerryHarry');
          expect(res[1].x).to.be.equal('JusticeCourageTemperanceWisdom');
          expect(res[2].x).to.be.equal('PiratesNinjas');
          done();
        });
      });
    });

    context('when using longest accumlator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.LONGEST}
          ]
        },
        channels: {
          x: { field: 'friends', type: 'ordinal' }
        }
      };
      const pipeline = aggBuilder.constructPipeline(state);

      it('builds the correct agg pipeline with the "longest" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $reduce: {
                in: {
                  $cond: {
                    else: '$$value',
                    if: {
                      $gt: [{$strLenCP: '$$this'}, {$strLenCP: '$$value'}]
                    },
                    then: '$$this'
                  }
                },
                initialValue: {
                  $arrayElemAt: ['$friends', 0]
                },
                input: '$friends'
              }
            }
          }
        });
      });

      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }

        dataService.aggregate(`${DB}.array_of_strings`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(3);
          expect(res[0].x).to.be.equal('Jerry');
          expect(res[1].x).to.be.equal('Temperance');
          expect(res[2].x).to.be.equal('Pirates');
          done();
        });
      });
    });

    context('when using shortest accumlator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.SHORTEST}
          ]
        },
        channels: {
          x: { field: 'friends', type: 'ordinal' }
        }
      };
      const pipeline = aggBuilder.constructPipeline(state);

      it('builds the correct agg pipeline with the "shortest" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $reduce: {
                in: {
                  $cond: {
                    else: '$$value',
                    if: {
                      $lt: [{$strLenCP: '$$this'}, {$strLenCP: '$$value'}]
                    },
                    then: '$$this'
                  }
                },
                initialValue: {
                  $arrayElemAt: ['$friends', 0]
                },
                input: '$friends'
              }
            }
          }
        });
      });

      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }

        dataService.aggregate(`${DB}.array_of_strings`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(3);
          expect(res[0].x).to.be.equal('Tom');
          expect(res[1].x).to.be.equal('Wisdom');
          expect(res[2].x).to.be.equal('Ninjas');
          done();
        });
      });
    });
  });
});
