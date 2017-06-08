/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
const aggBuilder = require('../../src/internal-packages/chart/lib/store/array-reduction');

describe('Array Reduction', function() {
  context('no reductions are present', function() {
    const reductions = [];
    it('returns `null`', function() {
      const result = aggBuilder(reductions);
      expect(result).to.be.an('array');
      expect(result).to.be.empty;
    });
  });
  context('one reduction is present', function() {
    const reductions = [
      {field: 'myField', type: 'min'}
    ];
    it('builds the correct agg pipeline', function() {
      const result = aggBuilder(reductions);
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
  context('two reductions are present', function() {
    const reductions = [
      {field: 'myField', type: 'min'},
      {field: 'myField', type: 'max'}
    ];
    it('builds the correct agg pipeline', function() {
      const result = aggBuilder(reductions);
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
  context('three reductions are present', function() {
    const reductions = [
      {field: 'myField', type: 'length'},
      {field: 'myField', type: 'min'},
      {field: 'myField', type: 'mean'}
    ];
    it('builds the correct agg pipeline', function() {
      const result = aggBuilder(reductions);
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
  context('$unwind reduction', function() {
    it('creates a unwind stage for a single unwind reduction', function() {
      const reductions = [
        {field: 'foo', type: 'unwind'}
      ];
      const result = aggBuilder(reductions);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.be.deep.equal({
        $unwind: 'foo'
      });
    });
    it('creates multiple unwind stages one for each reduction', function() {
      const reductions = [
        {field: 'foo', type: 'unwind'},
        {field: 'foo.bar.baz', type: 'unwind'}
      ];
      const result = aggBuilder(reductions);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.be.deep.equal({
        $unwind: 'foo'
      });
      expect(result[1]).to.be.deep.equal({
        $unwind: 'foo.bar.baz'
      });
    });
    it('creates an unwind stage and an addField stage for mixed reductions', function() {
      const reductions = [
        {field: 'foo', type: 'unwind'},
        {field: 'foo.bar.baz', type: 'min'}
      ];
      const result = aggBuilder(reductions);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.be.deep.equal({
        $unwind: 'foo'
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
  context('Reduction Operators', function() {
    const reductions = [
      {field: 'foo', type: 'maxStringLength'}
    ];
    it('calculates the maximum string length', function() {
      const result = aggBuilder(reductions);
      expect(result).to.be.an('array');
      expect(result[0].$addFields.foo).to.be.deep.equal({
        $max: {
          $map: {
            input: '$foo',
            as: 'str',
            in: {
              $strLenBytes: '$$str'
            }
          }
        }
      });
    });
  });
});
