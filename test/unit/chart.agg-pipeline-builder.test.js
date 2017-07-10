/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
const AggPipelineBuilder = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');
const Aliaser = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/aliaser');
const {
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  AGGREGATE_FUNCTION_ENUM,
  MEASUREMENT_ENUM
} = require('../../src/internal-packages/chart/lib/constants');

// const debug = require('debug')('mongodb-compass:charts:test:array-reduction');

const aggBuilder = new AggPipelineBuilder();

describe('Aggregation Pipeline Builder', function() {
  beforeEach(function() {
    aggBuilder._reset();
  });
  describe('Aliases', function() {
    let aliaser;
    beforeEach(function() {
      aliaser = new Aliaser();
    });
    it('creates the right alias for a field/channel combination', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(1);
      expect(aliaser.aliases).to.have.all.keys('bar_foo');
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
    });
    it('works with field names containing underscores', function() {
      aliaser.assignUniqueAlias('foo_foo_foo', 'bar');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(1);
      expect(aliaser.aliases).to.have.all.keys('bar_foo_foo_foo');
      expect(aliaser.aliases.bar_foo_foo_foo).to.be.equal('__alias_0');
    });
    it('does not create duplicate alias for the same field/channel combination', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      aliaser.assignUniqueAlias('foo', 'bar');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(1);
      expect(aliaser.aliases).to.have.all.keys('bar_foo');
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
    });
    it('creates multiple aliases for different fields same channel', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      aliaser.assignUniqueAlias('baz', 'bar');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(2);
      expect(aliaser.aliases).to.have.all.keys(['bar_foo', 'bar_baz']);
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
      expect(aliaser.aliases.bar_baz).to.be.equal('__alias_1');
    });
    it('creates multiple aliases for same field different channels', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      aliaser.assignUniqueAlias('foo', 'baz');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(2);
      expect(aliaser.aliases).to.have.all.keys(['bar_foo', 'baz_foo']);
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
      expect(aliaser.aliases.baz_foo).to.be.equal('__alias_1');
    });
    it('creates multiple aliases for different fields and channels', function() {
      aliaser.assignUniqueAlias('foo', 'bar');
      aliaser.assignUniqueAlias('fii', 'bor');
      expect(Object.keys(aliaser.aliases)).to.have.lengthOf(2);
      expect(aliaser.aliases).to.have.all.keys(['bar_foo', 'bor_fii']);
      expect(aliaser.aliases.bar_foo).to.be.equal('__alias_0');
      expect(aliaser.aliases.bor_fii).to.be.equal('__alias_1');
    });
  });
  describe('Query Segment', function() {
    context('when no query properties are present', function() {
      it('has an empty query segment', function() {
        const state = {
          queryCache: {}
        };
        aggBuilder._constructQuerySegment(state);
        const result = aggBuilder.segments.query;
        expect(result).to.be.an('array');
        expect(result).to.be.empty;
      });
    });
    context('when a single query property is present', function() {
      it('has an $match stage in the query segment', function() {
        const state = {
          queryCache: {
            filter: {foo: 'bar'}
          }
        };
        aggBuilder._constructQuerySegment(state);
        const result = aggBuilder.segments.query;
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $match: {
            foo: 'bar'
          }
        });
      });
      it('has an $sort stage in the query segment', function() {
        const state = {
          queryCache: {
            sort: {
              foo: 1,
              bar: 1
            }
          }
        };
        aggBuilder._constructQuerySegment(state);
        const result = aggBuilder.segments.query;
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $sort: {
            foo: 1,
            bar: 1
          }
        });
      });
      it('has an $skip stage in the query segment', function() {
        const state = {
          queryCache: {
            skip: 200
          }
        };
        aggBuilder._constructQuerySegment(state);
        const result = aggBuilder.segments.query;
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $skip: 200
        });
      });
      it('has an $limit stage in the query segment', function() {
        const state = {
          queryCache: {
            limit: 999
          }
        };
        aggBuilder._constructQuerySegment(state);
        const result = aggBuilder.segments.query;
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $limit: 999
        });
      });
      it('has an $sample stage in the query segment', function() {
        const state = {
          queryCache: {
            limit: 10,
            sample: true
          }
        };
        aggBuilder._constructQuerySegment(state);
        const result = aggBuilder.segments.query;
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(1);
        expect(result[0]).to.be.deep.equal({
          $sample: {
            size: 10
          }
        });
      });
    });
    context('when all query properties are present', function() {
      it('has the stages in the right order', function() {
        const state = {
          queryCache: {
            filter: {foo: 'bar'},
            sort: {baz: 1},
            skip: 20,
            limit: 10,
            sample: true
          }
        };
        aggBuilder._constructQuerySegment(state);
        const result = aggBuilder.segments.query;
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(4);
        expect(result[0]).to.have.keys('$match');
        expect(result[1]).to.have.keys('$sort');
        expect(result[2]).to.have.keys('$skip');
        expect(result[3]).to.have.keys('$sample');
      });
    });
  });
  describe('Reduction Segment', function() {
    context('for a single channel', function() {
      context('when no reductions are present', function() {
        const state = {reductions: {x: []}};
        it('returns `null`', function() {
          aggBuilder._constructReductionSegment(state);
          const result = aggBuilder.segments.reduction;
          expect(result).to.be.an('array');
          expect(result).to.be.empty;
        });
      });
      context('when one reduction is present', function() {
        const state = {
          reductions: {
            x: [{field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MIN}]
          }
        };
        it('builds the correct agg pipeline', function() {
          aggBuilder._constructReductionSegment(state);
          const result = aggBuilder.segments.reduction;
          expect(result).to.be.an('array');
          expect(result[0]).to.be.deep.equal({
            $addFields: {
              __alias_0: {
                $min: '$myField'
              }
            }
          });
        });
      });
      context('when two reductions are present', function() {
        const state = {
          reductions: {
            x: [
              {field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MAX},
              {field: 'myField.inner', type: ARRAY_NUMERIC_REDUCTIONS.MIN}
            ]
          }
        };
        it('builds the correct agg pipeline', function() {
          aggBuilder._constructReductionSegment(state);
          const result = aggBuilder.segments.reduction;
          expect(result).to.be.an('array');
          expect(result[0]).to.be.deep.equal({
            $addFields: {
              __alias_0: {
                $max: {
                  $map: {
                    input: '$myField',
                    as: 'value',
                    in: {
                      $min: '$$value.inner'
                    }
                  }
                }
              }
            }
          });
          expect(aggBuilder.aliaser.aliases).to.have.keys('x_myField.inner');
          expect(aggBuilder.aliaser.aliases['x_myField.inner']).to.be.equal('__alias_0');
        });
      });
      context('when three reductions are present', function() {
        const state = {
          reductions: {
            x: [
              {field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MEAN},
              {field: 'myField.middle1', type: ARRAY_NUMERIC_REDUCTIONS.MIN},
              {field: 'myField.middle1.middle2.inner', type: ARRAY_GENERAL_REDUCTIONS.LENGTH}
            ]
          }
        };
        it('builds the correct agg pipeline', function() {
          aggBuilder._constructReductionSegment(state);
          const result = aggBuilder.segments.reduction;
          expect(result).to.be.an('array');
          expect(result[0]).to.be.deep.equal({
            $addFields: {
              __alias_0: {
                $avg: {
                  $map: {
                    input: '$myField',
                    as: 'value',
                    in: {
                      $min: {
                        $map: {
                          input: '$$value.middle1',
                          as: 'value',
                          in: {
                            $cond: {
                              if: {
                                $isArray: '$$value.middle2.inner'
                              },
                              then: {
                                $size: '$$value.middle2.inner'
                              },
                              else: 0
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          });
          expect(aggBuilder.aliaser.aliases).to.have.keys('x_myField.middle1.middle2.inner');
          expect(aggBuilder.aliaser.aliases['x_myField.middle1.middle2.inner']).to.be.equal('__alias_0');
        });
      });
      context('when using $unwind reduction', function() {
        it('creates a unwind stage for a single unwind reduction', function() {
          const state = {
            reductions: {
              x: [
                {field: 'foo', type: ARRAY_GENERAL_REDUCTIONS.UNWIND}
              ]
            }
          };
          aggBuilder._constructReductionSegment(state);
          const result = aggBuilder.segments.reduction;
          expect(result).to.be.an('array');
          expect(result).to.have.lengthOf(1);
          expect(result[0]).to.be.deep.equal({
            $unwind: '$foo'
          });
        });
        it('creates multiple unwind stages one for each reduction', function() {
          const state = {
            reductions: {
              x: [
                {field: 'foo', type: ARRAY_GENERAL_REDUCTIONS.UNWIND},
                {field: 'foo.bar.baz', type: ARRAY_GENERAL_REDUCTIONS.UNWIND}
              ]
            }
          };
          aggBuilder._constructReductionSegment(state);
          const result = aggBuilder.segments.reduction;
          expect(result).to.be.an('array');
          expect(result).to.have.lengthOf(2);
          expect(result[0]).to.be.deep.equal({
            $unwind: '$foo'
          });
          expect(result[1]).to.be.deep.equal({
            $unwind: '$foo.bar.baz'
          });
        });
        it('creates an unwind stage and an addField stage for mixed reductions', function() {
          const state = {
            reductions: {
              x: [
                {field: 'foo', type: ARRAY_GENERAL_REDUCTIONS.UNWIND},
                {field: 'foo.bar.baz', type: ARRAY_NUMERIC_REDUCTIONS.MIN}
              ]
            }
          };
          aggBuilder._constructReductionSegment(state);
          const result = aggBuilder.segments.reduction;
          expect(result).to.be.an('array');
          expect(result).to.have.lengthOf(2);
          expect(result[0]).to.be.deep.equal({
            $unwind: '$foo'
          });
          expect(result[1]).to.be.deep.equal({
            $addFields: {
              '__alias_0': {
                $min: '$foo.bar.baz'
              }
            }
          });
          expect(aggBuilder.aliaser.aliases).to.have.keys('x_foo.bar.baz');
          expect(aggBuilder.aliaser.aliases['x_foo.bar.baz']).to.be.equal('__alias_0');
        });
      });
      context('for Reduction Operators', function() {
        const state = {
          reductions: {
            x: [
              {field: 'foo', type: ARRAY_STRING_REDUCTIONS.MAX_LENGTH}
            ]
          }
        };
        it('calculates the maximum string length', function() {
          aggBuilder._constructReductionSegment(state);
          const result = aggBuilder.segments.reduction;
          expect(result).to.be.an('array');
          expect(result[0]).to.be.deep.equal({
            $addFields: {
              __alias_0: {
                $max: {
                  $map: {
                    input: '$foo',
                    as: 'str',
                    in: {
                      $strLenCP: '$$str'
                    }
                  }
                }
              }
            }
          });
          expect(aggBuilder.aliaser.aliases).to.have.keys('x_foo');
          expect(aggBuilder.aliaser.aliases.x_foo).to.be.equal('__alias_0');
        });
      });
    });
    context('for multiple channels', function() {
      const state = {
        reductions: {
          x: [{field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MIN}],
          y: [{field: 'myOtherField', type: ARRAY_NUMERIC_REDUCTIONS.MAX}]
        }
      };
      it('builds the correct agg pipeline', function() {
        aggBuilder._constructReductionSegment(state);
        const result = aggBuilder.segments.reduction;
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $addFields: {
            __alias_0: {
              $min: '$myField'
            }
          }
        });
        expect(result[1]).to.be.deep.equal({
          $addFields: {
            __alias_1: {
              $max: '$myOtherField'
            }
          }
        });
        expect(aggBuilder.aliaser.aliases).to.have.keys(['x_myField', 'y_myOtherField']);
        expect(aggBuilder.aliaser.aliases.x_myField).to.be.equal('__alias_0');
        expect(aggBuilder.aliaser.aliases.y_myOtherField).to.be.equal('__alias_1');
      });
    });
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
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder.aliaser.assignUniqueAlias('foo', 'x');
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder.aliaser.assignUniqueAlias('bar', 'y');
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder.aliaser.assignUniqueAlias('something', 'x');
        aggBuilder.aliaser.assignUniqueAlias('something_else', 'y');
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder.aliaser.assignUniqueAlias('foo', 'x');
        aggBuilder.aliaser.assignUniqueAlias('bar', 'y');
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
        aggBuilder._constructAggregationSegment(state);
        const result = aggBuilder.segments.aggregation;
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
  describe('Encoding Segment', function() {
    context('when using $unwind reductions', function() {
      it('does not create any aliases', function() {
        const state = {
          reductions: {
            x: [
              {field: 'foo', type: ARRAY_GENERAL_REDUCTIONS.UNWIND}
            ]
          }
        };
        aggBuilder._constructReductionSegment(state);
        expect(aggBuilder.aliaser.aliases).to.be.empty;
      });
    });
    context('when using $addFields reductions', function() {
      it('creates correct aliases in order', function() {
        const state = {
          reductions: {
            x: [
              {field: 'foo', type: ARRAY_NUMERIC_REDUCTIONS.MAX}
            ],
            color: [
              {field: 'bar', type: ARRAY_NUMERIC_REDUCTIONS.MEAN}
            ]
          }
        };
        aggBuilder._constructReductionSegment(state);
        expect(aggBuilder.aliaser.aliases).to.have.all.keys(['x_foo', 'color_bar']);
        expect(aggBuilder.aliaser.aliases.x_foo).to.be.equal('__alias_0');
        expect(aggBuilder.aliaser.aliases.color_bar).to.be.equal('__alias_1');
      });
      it('maps aliases back to to correct channels', function() {
        const state = {
          reductions: {
            x: [
              {field: 'foo', type: ARRAY_GENERAL_REDUCTIONS.UNWIND}
            ],
            color: [
              {field: 'bar', type: ARRAY_NUMERIC_REDUCTIONS.MEAN}
            ]
          },
          channels: {
            x: {field: 'foo'},
            color: {field: 'bar'}
          }
        };
        aggBuilder.constructPipeline(state);
        const encodingSegment = aggBuilder.segments.encoding;
        expect(encodingSegment).to.be.an('array');
        expect(encodingSegment).to.have.lengthOf(1);
        expect(encodingSegment[0].$project).to.have.keys(['_id', 'x', 'color']);
        expect(encodingSegment[0].$project).to.be.deep.equal({
          _id: 0,
          x: '$foo',
          color: '$__alias_0'
        });
      });
    });
  });
});
