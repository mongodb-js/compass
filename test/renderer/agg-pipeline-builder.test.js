/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');

const {
  ARRAY_REDUCTION_TYPES,
  AGGREGATE_FUNCTION_ENUM,
  MEASUREMENT_ENUM
} = require('../../src/internal-packages/chart/lib/constants');

const DataService = require('mongodb-data-service');
const Connection = require('mongodb-connection-model');
const constructPipeline = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');
const semver = require('semver');
const _ = require('lodash');

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

  context('on the "compass_devs" collection', function() {
    before(function(done) {
      dataService.connect(function() {
        const docs = [
          {_id: 0, name: 'Thomas', loc: 'Australia', number: 2, favorite_days: ['Tuesday', 'Thursday']},
          {_id: 1, name: 'Durran', loc: 'Europe', number: 3, favorite_days: ['Monday']},
          {_id: 2, name: 'Anna', loc: 'Europe', number: 4, favorite_days: ['Wednesday', 'Friday', 'Saturday']},
          {_id: 3, name: 'Jessica', loc: 'Australia', number: 7, favorite_days: ['Tuesday']},
          {_id: 4, name: 'Lucas', loc: 'USA', number: 1, favorite_days: ['Monday', 'Sunday', 'Friday', 'Wednesday']},
          {_id: 5, name: 'Satya', loc: 'Australia', number: 6, favorite_days: ['Monday', 'Thursday']},
          {_id: 6, name: 'Peter', loc: 'USA', number: 5},
          {_id: 7, name: 'Matt', loc: 'Australia', number: 8, favorite_days: ['Friday']}
        ];
        dataService.insertMany(`${DB}.compass_devs`, docs, {}, done);
      });
    });

    context('when aggregating over numeric fields without dimension', function() {
      const state = {
        channels: {
          x: {
            field: 'number',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.MEAN
          }
        }
      };
      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }
        const pipeline = constructPipeline(state);
        dataService.aggregate(`${DB}.compass_devs`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(1);
          expect(res[0].x).to.be.equal(4.5);
          done();
        });
      });
    });
    context('when aggregating over numeric fields with one dimension', function() {
      const state = {
        channels: {
          x: {
            field: 'number',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.MEAN
          },
          y: {
            field: 'loc',
            type: MEASUREMENT_ENUM.NOMINAL
          }
        }
      };
      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }
        const pipeline = constructPipeline(state);
        dataService.aggregate(`${DB}.compass_devs`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(3);
          expect(_.find(res, 'y', 'Australia').x).to.be.equal(5.75);
          expect(_.find(res, 'y', 'USA').x).to.be.equal(3.0);
          expect(_.find(res, 'y', 'Europe').x).to.be.equal(3.5);
          done();
        });
      });
    });
    context('when aggregating over numeric fields with a 2-stage aggregation (variance)', function() {
      const state = {
        channels: {
          x: {
            field: 'number',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.VARIANCEP
          },
          y: {
            field: 'loc',
            type: MEASUREMENT_ENUM.NOMINAL
          }
        }
      };
      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }
        const pipeline = constructPipeline(state);
        dataService.aggregate(`${DB}.compass_devs`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(3);
          expect(_.find(res, 'y', 'Australia').x).to.be.closeTo(5.1875, 0.001);
          expect(_.find(res, 'y', 'USA').x).to.be.equal(4.0);
          expect(_.find(res, 'y', 'Europe').x).to.be.equal(0.25);
          done();
        });
      });
    });
    context('when aggregating over numeric fields with a 2-stage aggregation (distinct)', function() {
      const state = {
        channels: {
          x: {
            field: 'loc',
            type: MEASUREMENT_ENUM.NOMINAL,
            aggregate: AGGREGATE_FUNCTION_ENUM.DISTINCT
          }
        }
      };
      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }
        const pipeline = constructPipeline(state);
        dataService.aggregate(`${DB}.compass_devs`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(1);
          expect(res[0].x).to.be.equal(3); // 3 distinct locs
          done();
        });
      });
    });
    context('when aggregating over numeric fields with two dimensions', function() {
      const state = {
        channels: {
          x: {
            field: 'number',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.MEAN
          },
          y: {
            field: 'loc',
            type: MEASUREMENT_ENUM.NOMINAL
          },
          detail: {
            field: 'name',
            type: MEASUREMENT_ENUM.NOMINAL
          }
        }
      };
      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }
        const pipeline = constructPipeline(state);
        dataService.aggregate(`${DB}.compass_devs`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(8);
          done();
        });
      });
    });
    context('when using an unwind array reduction and aggregation', function() {
      const state = {
        reductions: {
          x: [
            {field: 'favorite_days', type: ARRAY_REDUCTION_TYPES.UNWIND}
          ]
        },
        channels: {
          x: {
            field: 'favorite_days',
            type: MEASUREMENT_ENUM.NOMINAL
          },
          y: {
            field: '_id',
            type: MEASUREMENT_ENUM.NOMINAL,
            aggregate: AGGREGATE_FUNCTION_ENUM.COUNT
          }
        }
      };
      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }
        const pipeline = constructPipeline(state);
        dataService.aggregate(`${DB}.compass_devs`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(7);
          expect(_.find(res, 'x', 'Monday').y).to.be.equal(3);
          expect(_.find(res, 'x', 'Tuesday').y).to.be.equal(2);
          expect(_.find(res, 'x', 'Wednesday').y).to.be.equal(2);
          expect(_.find(res, 'x', 'Thursday').y).to.be.equal(2);
          expect(_.find(res, 'x', 'Friday').y).to.be.equal(3);
          expect(_.find(res, 'x', 'Saturday').y).to.be.equal(1);
          expect(_.find(res, 'x', 'Sunday').y).to.be.equal(1);
          done();
        });
      });
    });
    context('when using a `length` array reduction and aggregation', function() {
      const state = {
        reductions: {
          x: [
            {field: 'favorite_days', type: ARRAY_REDUCTION_TYPES.LENGTH}
          ]
        },
        channels: {
          x: {
            field: 'favorite_days',
            type: MEASUREMENT_ENUM.QUANTITATIVE
          },
          y: {
            field: '_id',
            type: MEASUREMENT_ENUM.NOMINAL,
            aggregate: AGGREGATE_FUNCTION_ENUM.COUNT
          }
        }
      };
      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }
        const pipeline = constructPipeline(state);
        dataService.aggregate(`${DB}.compass_devs`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(5);
          expect(_.find(res, 'x', 0).y).to.be.equal(1);
          expect(_.find(res, 'x', 1).y).to.be.equal(3);
          expect(_.find(res, 'x', 2).y).to.be.equal(2);
          expect(_.find(res, 'x', 3).y).to.be.equal(1);
          expect(_.find(res, 'x', 4).y).to.be.equal(1);
          done();
        });
      });
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
        const pipeline = constructPipeline(state);
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

        const pipeline = constructPipeline(state);
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
      const pipeline = constructPipeline(state);

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

    context('when using mean accumulator', function() {
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
      const pipeline = constructPipeline(state);

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

    context('when using sum accumulator', function() {
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
      const pipeline = constructPipeline(state);

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

    context('when using concat accumulator', function() {
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
      const pipeline = constructPipeline(state);

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

    context('when using longest accumulator', function() {
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
      const pipeline = constructPipeline(state);

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

    context('when using shortest accumulator', function() {
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
      const pipeline = constructPipeline(state);

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

    context('when using min length accumulator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.MIN_LENGTH}
          ]
        },
        channels: {
          x: { field: 'friends', type: 'ordinal' }
        }
      };
      const pipeline = constructPipeline(state);

      it('builds the correct agg pipeline with the "min length" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $min: {
                $map: {
                  as: 'str',
                  in: {
                    $strLenCP: '$$str'
                  },
                  input: '$friends'
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

        dataService.aggregate(`${DB}.array_of_strings`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(3);
          expect(res[0].x).to.be.equal(3);
          expect(res[1].x).to.be.equal(6);
          expect(res[2].x).to.be.equal(6);
          done();
        });
      });
    });

    context('when using max length accumulator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.MAX_LENGTH}
          ]
        },
        channels: {
          x: { field: 'friends', type: 'ordinal' }
        }
      };
      const pipeline = constructPipeline(state);

      it('builds the correct agg pipeline with the "max length" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $max: {
                $map: {
                  as: 'str',
                  in: {
                    $strLenCP: '$$str'
                  },
                  input: '$friends'
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

        dataService.aggregate(`${DB}.array_of_strings`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.have.lengthOf(3);
          expect(res[0].x).to.be.equal(5);
          expect(res[1].x).to.be.equal(10);
          expect(res[2].x).to.be.equal(7);
          done();
        });
      });
    });

    context('when using the "index" accumulator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.INDEX, arguments: [0]}
          ]
        },
        channels: {
          x: { field: 'friends', type: 'ordinal' }
        }
      };
      const pipeline = constructPipeline(state);

      it('builds the correct agg pipeline with the "index" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $arrayElemAt: ['$friends', 0]
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
          expect(res).to.be.deep.equal([
            {x: 'Tom'},
            {x: 'Justice'},
            {x: 'Pirates'}
          ]);
          done();
        });
      });
    });

    context('when using the "existence of value" accumulator', function() {
      const state = {
        reductions: {
          x: [
            {field: 'friends', type: ARRAY_REDUCTION_TYPES.EXISTENCE_OF_VALUE, arguments: ['Tom']}
          ]
        },
        channels: {
          x: { field: 'friends', type: 'ordinal' }
        }
      };
      const pipeline = constructPipeline(state);

      it('builds the correct agg pipeline with the "existence of value" reduction', function() {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              $in: ['Tom', '$friends']
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
          expect(res).to.be.deep.equal([
            {x: true},
            {x: false},
            {x: false}
          ]);
          done();
        });
      });
    });
  });

  context.skip('COMPASS-1413 On a "coordinate_pairs" collection', function() {
    before(function(done) {
      dataService.connect(function() {
        const docs = [
          {_id: 0, coordinate_pairs: [
            ['1.1', '1.1'],
            ['1.2', '1.2'],
            ['2.1', '2.1'],
            ['2.2', '2.2']
          ]},
          {_id: 1, coordinate_pairs: [
            ['3.1', '3.1'],
            ['3.2', '3.2'],
            ['4.1', '4.1'],
            ['4.2', '4.2']
          ]}
        ];
        dataService.insertMany(`${DB}.coordinate_pairs`, docs, {}, done);
      });
    });

    context('with arguments in the first and last reduction stages', () => {
      const state = {
        reductions: {
          x: [
            {field: 'coordinate_pairs', type: ARRAY_REDUCTION_TYPES.INDEX, arguments: [0]},
            {field: 'coordinate_pairs', type: ARRAY_REDUCTION_TYPES.INDEX, arguments: [0]}
          ]
        },
        channels: {
          x: { field: 'coordinate_pairs', type: 'ordinal' }
        }
      };
      const pipeline = constructPipeline(state);

      it('builds the correct agg pipeline with the "index" reductions', () => {
        expect(pipeline).to.be.an('array');
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              '$arrayElemAt': [{
                '$map': {
                  'as': 'value',
                  'in': {
                    '$arrayElemAt': ['$$value.coordinate_pairs', 0]
                  },
                  'input': '$coordinate_pairs'
                }
              }, 0]
            }
          }
        });
      });

      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }

        dataService.aggregate(`${DB}.coordinate_pairs`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.be.deep.equal([
            // TODO: Fill me in with correct expected results
            {x: null},
            {x: null}
          ]);
          done();
        });
      });
    });
  });

  context.skip('COMPASS-1413 On a "matrix_3D" collection', function() {
    before(function(done) {
      dataService.connect(function() {
        const docs = [
          // Think cubes
          {_id: 0, matrix_3D: [
            [
              ['1_1_1', '1_1_2'],
              ['1_2_1', '1_2_2']
            ],
            [
              ['2_1_1', '2_1_2'],
              ['2_2_1', '2_2_2']
            ]
          ]},
          {_id: 1, matrix_3D: [
            [
              ['a_1_1', 'a_1_2'],
              ['a_2_1', 'a_2_2']
            ],
            [
              ['b_1_1', 'b_1_2'],
              ['b_2_1', 'b_2_2']
            ]
          ]}
        ];
        dataService.insertMany(`${DB}.matrix_3D`, docs, {}, done);
      });
    });

    context('with arguments in the first, middle and last reduction stages', () => {
      const state = {
        reductions: {
          x: [
            {field: 'matrix_3D', type: ARRAY_REDUCTION_TYPES.INDEX, arguments: [0]},
            {field: 'matrix_3D', type: ARRAY_REDUCTION_TYPES.INDEX, arguments: [0]},
            {field: 'matrix_3D', type: ARRAY_REDUCTION_TYPES.INDEX, arguments: [0]}
          ]
        },
        channels: {
          x: { field: 'matrix_3D', type: 'ordinal' }
        }
      };
      const pipeline = constructPipeline(state);

      it('builds the correct agg pipeline with the "index" reductions', () => {
        expect(pipeline).to.be.an('array');
        const inner = {
          '$map': {
            'as': 'value',
            'in': {
              '$arrayElemAt': ['$$value.matrix_3D', 0]
            },
            'input': '$$value.matrix_3D'
          }
        };
        const middle = {
          '$map': {
            'as': 'value',
            'in': {
              '$arrayElemAt': [inner, 0]
            },
            'input': '$matrix_3D'
          }
        };
        expect(pipeline[0]).to.be.deep.equal({
          $addFields: {
            '__alias_0': {
              '$arrayElemAt': [middle, 0]
            }
          }
        });
      });

      it('returns the correct results when executing the pipeline', function(done) {
        if (!versionSupported) {
          this.skip();
        }

        dataService.aggregate(`${DB}.matrix_3D`, pipeline, {}, function(err, res) {
          expect(err).to.be.null;
          expect(res).to.be.deep.equal([
            // TODO: Fill me in with correct expected results
            {x: null},
            {x: null}
          ]);
          done();
        });
      });
    });
  });
});
