/* eslint no-unused-expressions: 0 */
const constructAggregationSegment = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/segment-aggregation');
const Aliaser = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/aliaser');
const { expect } = require('chai');

const {
  AGGREGATE_FUNCTION_ENUM,
  MEASUREMENT_ENUM
} = require('../../src/internal-packages/chart/lib/constants');


describe('Aggregation Pipeline Builder', function() {
  let aliaser;
  beforeEach(function() {
    aliaser = new Aliaser();
  });
  describe('Aggregation Segment', function() {
    context('when no measures are present', function() {
      const state = {
        channels: {
          x: {field: 'foo', type: MEASUREMENT_ENUM.NOMINAL},
          y: {field: 'bar', type: MEASUREMENT_ENUM.QUANTITATIVE}
        }
      };
      it('returns an empty aggregation segment', function() {
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.be.empty;
      });
    });
    context('when no dimensions are present', function() {
      const state = {
        channels: {
          y: {
            field: 'bar',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.MEAN
          }
        }
      };
      it('builds the correct $group and $project stages', function() {
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {},
            __alias_0: {
              $avg: '$bar'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_0: 1
          }
        });
      });
    });
    context('when a measure is present that requires 2-stage aggregation (variance)', function() {
      const state = {
        channels: {
          x: {
            field: 'foo',
            type: MEASUREMENT_ENUM.NOMINAL
          },
          y: {
            field: 'bar',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.VARIANCE
          }
        }
      };
      it('builds the correct $group and $project stages', function() {
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {
              __alias_0: '$foo'
            },
            __alias_1: {
              $stdDevSamp: '$bar'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_0: '$_id.__alias_0',
            __alias_1: {
              $pow: ['$__alias_1', 2]
            }
          }
        });
      });
    });
    context('when a measure is present that requires 2-stage aggregation (distinct)', function() {
      const state = {
        channels: {
          x: {
            field: 'foo',
            type: MEASUREMENT_ENUM.NOMINAL
          },
          y: {
            field: 'bar',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.DISTINCT
          }
        }
      };
      it('builds the correct $group and $project stages', function() {
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {
              __alias_0: '$foo'
            },
            __alias_1: {
              $addToSet: '$bar'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_0: '$_id.__alias_0',
            __alias_1: {
              $size: '$__alias_1'
            }
          }
        });
      });
    });
    context('when one measure and one dimension are present', function() {
      const state = {
        channels: {
          x: {
            field: 'foo',
            type: MEASUREMENT_ENUM.NOMINAL
          },
          y: {
            field: 'bar',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.MEAN
          }
        }
      };
      it('builds the correct $group and $project stages', function() {
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {
              __alias_0: '$foo'
            },
            __alias_1: {
              $avg: '$bar'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_0: '$_id.__alias_0',
            __alias_1: 1
          }
        });
      });
      it('handles previous field aliases on the dimension correctly', function() {
        aliaser.assignUniqueAlias('foo', 'x');
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {
              __alias_0: '$__alias_0'
            },
            __alias_1: {
              $avg: '$bar'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_0: '$_id.__alias_0',
            __alias_1: 1
          }
        });
      });
      it('handles previous field aliases on the measure correctly', function() {
        aliaser.assignUniqueAlias('bar', 'y');
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {
              __alias_1: '$foo'
            },
            __alias_0: {
              $avg: '$__alias_0'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_1: '$_id.__alias_1',
            __alias_0: 1
          }
        });
      });
      it('handles previous unrelated field aliases correctly', function() {
        aliaser.assignUniqueAlias('something', 'x');
        aliaser.assignUniqueAlias('something_else', 'y');
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {
              __alias_2: '$foo'
            },
            __alias_3: {
              $avg: '$bar'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_2: '$_id.__alias_2',
            __alias_3: 1
          }
        });
      });
      it('handles previous field aliases on measure and dimension correctly', function() {
        aliaser.assignUniqueAlias('foo', 'x');
        aliaser.assignUniqueAlias('bar', 'y');
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {
              __alias_0: '$__alias_0'
            },
            __alias_1: {
              $avg: '$__alias_1'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_0: '$_id.__alias_0',
            __alias_1: 1
          }
        });
      });
    });
    context('when multiple dimensions are present', function() {
      const state = {
        channels: {
          x: {
            field: 'foo',
            type: MEASUREMENT_ENUM.NOMINAL
          },
          y: {
            field: 'bar',
            type: MEASUREMENT_ENUM.QUANTITATIVE,
            aggregate: AGGREGATE_FUNCTION_ENUM.MEAN
          },
          color: {
            field: 'baz',
            type: MEASUREMENT_ENUM.TEMPORAL
          }
        }
      };
      it('builds the correct $group and $project stages', function() {
        const result = constructAggregationSegment(state, aliaser);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $group: {
            _id: {
              __alias_0: '$foo',
              __alias_1: '$baz'
            },
            __alias_2: {
              $avg: '$bar'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $project: {
            _id: 0,
            __alias_0: '$_id.__alias_0',
            __alias_1: '$_id.__alias_1',
            __alias_2: 1
          }
        });
      });
    });
  });
});
