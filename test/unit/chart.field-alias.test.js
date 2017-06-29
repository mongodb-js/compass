/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
const fieldAlias = require('../../src/internal-packages/chart/lib/store/field-alias');
const {
  ALIAS_PREFIX_ENUM,
  ARRAY_REDUCTION_TYPES,
  AGGREGATE_FUNCTION_ENUM
} = require('../../src/internal-packages/chart/lib/constants');

// const debug = require('debug')('mongodb-compass:charts:test:field-alias');

describe('Field Aliasing', function() {
  it('throws an error when the aliasType is invalid', function() {
    const field = 'myfield';
    const operator = 'something';
    const aliasType = 'invalid alias type';
    expect(fieldAlias.bind(null, field, aliasType, operator)).to.throw(/Unknown alias type/);
  });
  context('for array reductions', function() {
    const aliasType = ALIAS_PREFIX_ENUM.REDUCTION;
    it('throws an error when the reduction does not exist', function() {
      const field = 'myfield';
      const operator = 'something that does not exist';
      expect(fieldAlias.bind(null, field, aliasType, operator)).to.throw(/Expect a reduction operator/);
    });
    it('returns the correct alias on valid input', function() {
      const field = 'myfield';
      const operator = ARRAY_REDUCTION_TYPES.UNWIND;

      const result = fieldAlias(field, aliasType, operator);
      expect(result).to.be.a('string');
      expect(result).to.be.equal('red_unwind_myfield');
    });
  });
  context('for aggregates', function() {
    const aliasType = ALIAS_PREFIX_ENUM.AGGREGATE;
    it('throws an error when the aggregate does not exist', function() {
      const field = 'myfield';
      const operator = 'something that does not exist';
      expect(fieldAlias.bind(null, field, aliasType, operator)).to.throw(/Expect an aggregate operator/);
    });
    it('returns the correct alias on valid input', function() {
      const field = 'myfield';
      const operator = AGGREGATE_FUNCTION_ENUM.MEAN;

      const result = fieldAlias(field, aliasType, operator);
      expect(result).to.be.a('string');
      expect(result).to.be.equal('agg_mean_myfield');
    });
  });
});
