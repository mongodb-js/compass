/* eslint no-unused-expressions: 0 */
const constructReductionSegment = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/segment-reduction');
const Aliaser = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder/aliaser');
const { expect } = require('chai');

const {
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  ARRAY_GENERAL_REDUCTIONS
} = require('../../src/internal-packages/chart/lib/constants');


describe('Aggregation Pipeline Builder', function() {
  let aliaser;
  beforeEach(function() {
    aliaser = new Aliaser();
  });
  describe('Reduction Segment', function() {
    context('for a single channel', function() {
      context('when no reductions are present', function() {
        const state = {reductions: {x: []}, channels: {x: {}}};
        it('returns `null`', function() {
          const result = constructReductionSegment(state, aliaser);
          expect(result).to.be.an('array');
          expect(result).to.be.empty;
        });
      });
      context('when one reduction is present', function() {
        const state = {
          reductions: {
            x: [{field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MIN}]
          },
          channels: {
            x: {field: 'myField'}
          }
        };
        it('builds the correct agg pipeline', function() {
          const result = constructReductionSegment(state, aliaser);
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
          },
          channels: {
            x: {field: 'myField.inner'}
          }
        };
        it('builds the correct agg pipeline', function() {
          const result = constructReductionSegment(state, aliaser);
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
          expect(aliaser.aliases).to.have.keys('x_myField.inner');
          expect(aliaser.aliases['x_myField.inner']).to.be.equal('__alias_0');
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
          },
          channels: {
            x: {field: 'myField.middle1.middle2.inner'}
          }
        };
        it('builds the correct agg pipeline', function() {
          const result = constructReductionSegment(state, aliaser);
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
          expect(aliaser.aliases).to.have.keys('x_myField.middle1.middle2.inner');
          expect(aliaser.aliases['x_myField.middle1.middle2.inner']).to.be.equal('__alias_0');
        });
      });
      context('when using $unwind reduction', function() {
        it('creates a unwind stage for a single unwind reduction', function() {
          const state = {
            reductions: {
              x: [
                {field: 'foo', type: ARRAY_GENERAL_REDUCTIONS.UNWIND}
              ]
            },
            channels: {
              x: {field: 'foo'}
            }
          };
          const result = constructReductionSegment(state, aliaser);
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
            },
            channels: {
              x: {field: 'foo.bar.baz'}
            }
          };
          const result = constructReductionSegment(state, aliaser);
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
            },
            channels: {
              x: {field: 'foo.bar.baz'}
            }
          };
          const result = constructReductionSegment(state, aliaser);
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
          expect(aliaser.aliases).to.have.keys('x_foo.bar.baz');
          expect(aliaser.aliases['x_foo.bar.baz']).to.be.equal('__alias_0');
        });
      });
      context('for Reduction Operators', function() {
        const state = {
          reductions: {
            x: [
              {field: 'foo', type: ARRAY_STRING_REDUCTIONS.MAX_LENGTH}
            ]
          },
          channels: {
            x: {field: 'foo'}
          }
        };
        it('calculates the maximum string length', function() {
          const result = constructReductionSegment(state, aliaser);
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
          expect(aliaser.aliases).to.have.keys('x_foo');
          expect(aliaser.aliases.x_foo).to.be.equal('__alias_0');
        });
      });
    });
    context('for multiple channels', function() {
      const state = {
        reductions: {
          x: [{field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MIN}],
          y: [{field: 'myOtherField', type: ARRAY_NUMERIC_REDUCTIONS.MAX}]
        },
        channels: {
          x: {field: 'myField'},
          y: {field: 'myOtherField'}
        }
      };
      it('builds the correct agg pipeline', function() {
        const result = constructReductionSegment(state, aliaser);
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
        expect(aliaser.aliases).to.have.keys(['x_myField', 'y_myOtherField']);
        expect(aliaser.aliases.x_myField).to.be.equal('__alias_0');
        expect(aliaser.aliases.y_myOtherField).to.be.equal('__alias_1');
      });
    });
  });
});
