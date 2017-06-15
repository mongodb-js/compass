/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
const aggBuilder = require('../../src/internal-packages/chart/lib/store/agg-pipeline-builder');
const {
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS
} = require('../../src/internal-packages/chart/lib/constants');

const debug = require('debug')('mongodb-compass:charts:test:array-reduction');

describe('Array Reduction', function() {
  context('for a single channel', function() {
    context('when no reductions are present', function() {
      const state = {reductions: {x: []}};
      it('returns `null`', function() {
        const result = aggBuilder(state);
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
        const result = aggBuilder(state);
        expect(result).to.be.an('array');
        expect(result[0]).to.be.deep.equal({
          $addFields: {
            myField: {
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
            {field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MIN}
          ]
        }
      };
      it('builds the correct agg pipeline', function() {
        const result = aggBuilder(state);
        expect(result).to.be.an('array');
        expect(result[0]).to.be.deep.equal({
          $addFields: {
            myField: {
              $max: {
                $map: {
                  input: '$myField',
                  as: 'value',
                  in: {
                    $min: '$$value'
                  }
                }
              }
            }
          }
        });
      });
    });
    context('when three reductions are present', function() {
      const state = {
        reductions: {
          x: [
            {field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MEAN},
            {field: 'myField', type: ARRAY_NUMERIC_REDUCTIONS.MIN},
            {field: 'myField', type: ARRAY_GENERAL_REDUCTIONS.LENGTH}
          ]
        }
      };
      it('builds the correct agg pipeline', function() {
        const result = aggBuilder(state);
        expect(result).to.be.an('array');
        expect(result[0]).to.be.deep.equal({
          $addFields: {
            myField: {
              $avg: {
                $map: {
                  input: '$myField',
                  as: 'value',
                  in: {
                    $min: {
                      $map: {
                        input: '$$value',
                        as: 'value',
                        in: {
                          $size: '$$value'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        });
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
        const result = aggBuilder(state);
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
              // Can accept the short field syntax of 'foo' for the first
              // field, as well as the fully qualified 'foo.bar.baz'
              {field: 'foo', type: ARRAY_GENERAL_REDUCTIONS.UNWIND},
              {field: 'foo.bar.baz', type: ARRAY_GENERAL_REDUCTIONS.UNWIND}
            ]
          }
        };
        const result = aggBuilder(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $unwind: '$foo'
        });
        expect(result[1]).to.be.deep.equal({
          $unwind: '$foo.bar'
        });
      });
      it('COMPASS-1244 creates multiple unwind stages for the same field', function() {
        const state = {
          reductions: {
            x: [
              {field: 'foo.bar.baz.js', type: ARRAY_GENERAL_REDUCTIONS.UNWIND},
              {field: 'foo.bar.baz.js', type: ARRAY_GENERAL_REDUCTIONS.UNWIND},
              {field: 'foo.bar.baz.js', type: ARRAY_GENERAL_REDUCTIONS.UNWIND}
            ]
          }
        };
        const result = aggBuilder(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(3);
        expect(result[0]).to.be.deep.equal({
          $unwind: '$foo'
        });
        expect(result[1]).to.be.deep.equal({
          $unwind: '$foo.bar'
        });
        expect(result[2]).to.be.deep.equal({
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
        const result = aggBuilder(state);
        expect(result).to.be.an('array');
        expect(result).to.have.lengthOf(2);
        expect(result[0]).to.be.deep.equal({
          $unwind: '$foo'
        });
        expect(result[1]).to.be.deep.equal({
          $addFields: {
            'foo.bar.baz': {
              $min: '$foo.bar.baz'
            }
          }
        });
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
        const result = aggBuilder(state);
        expect(result).to.be.an('array');
        expect(result[0].$addFields.foo).to.be.deep.equal({
          $max: {
            $map: {
              input: '$foo',
              as: 'str',
              in: {
                $strLenCP: '$$str'
              }
            }
          }
        });
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
      const result = aggBuilder(state);
      debug('result', result);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf('2');
      expect(result[0]).to.be.deep.equal({
        $addFields: {
          myField: {
            $min: '$myField'
          }
        }
      });
      expect(result[1]).to.be.deep.equal({
        $addFields: {
          myOtherField: {
            $max: '$myOtherField'
          }
        }
      });
    });
  });
});
