import React from 'react';
import { expect } from 'chai';
import { render, cleanup } from '@testing-library/react';
import Sinon from 'sinon';
import { Double } from 'bson';

import { makeCreateCondition } from './match-condition-form';
import MatchForm, {
  areUniqueExpressions,
  isNotEmptyCondition,
  makeCompactGroupExpression,
  toMatchConditionExpression,
  toMatchGroupExpression,
} from './match';
import fixtures, { SAMPLE_FIELDS } from './fixtures';
import { setComboboxValue } from '../../../../../test/form-helper';
import type { CreateConditionFn } from './match-condition-form';
import type { TypeCastTypes } from 'hadron-type-checker';
import { SINGLE_SELECT_LABEL } from '../field-combobox';

describe('match', function () {
  let createCondition: CreateConditionFn;
  beforeEach(function () {
    createCondition = makeCreateCondition();
  });

  describe('#helpers - isNotEmptyCondition', function () {
    it('should return true when a condition have both field and bsonType', function () {
      expect(
        isNotEmptyCondition(
          createCondition({
            field: 'name',
            bsonType: 'String',
          })
        )
      ).to.be.true;
    });

    it('should return false when condition does not have any of bsonType or field', function () {
      expect(isNotEmptyCondition(createCondition())).to.be.false;
      expect(
        isNotEmptyCondition(
          createCondition({
            field: 'name',
            bsonType: '' as TypeCastTypes,
          })
        )
      ).to.be.false;
      expect(
        isNotEmptyCondition(
          createCondition({
            bsonType: 'String',
          })
        )
      ).to.be.false;
    });
  });

  describe('#helpers - areUniqueExpressions', function () {
    it('should return true if keys of all the expressions in the provided list are unique otherwise false', function () {
      expect(
        areUniqueExpressions([{ name: 'Compass' }, { version: 'Standalone' }])
      ).to.be.true;

      expect(
        areUniqueExpressions([
          { name: 'Compass' },
          { version: 'Standalone' },
          { name: 'Something-else' },
        ])
      ).to.be.false;

      expect(
        areUniqueExpressions([
          { name: 'Compass' },
          { version: 'Standalone' },
          { wick: 'Something-else', name: 'Impossible' },
        ])
      ).to.be.false;
    });
  });

  describe('#helpers - toMatchConditionExpression', function () {
    it('should return a compact expression when operator is $eq', function () {
      const condition = createCondition({
        field: 'name',
        value: 'Compass',
        operator: '$eq',
        bsonType: 'String',
      });

      expect(toMatchConditionExpression(condition)).to.deep.equal({
        name: 'Compass',
      });
    });

    it('should return a verbose expression when operator anything but $eq', function () {
      const condition = createCondition({
        field: 'name',
        value: 'Compass',
        operator: '$ne',
        bsonType: 'String',
      });

      expect(toMatchConditionExpression(condition)).to.deep.equal({
        name: { $ne: 'Compass' },
      });
      expect(
        toMatchConditionExpression({ ...condition, operator: '$gt' })
      ).to.deep.equal({ name: { $gt: 'Compass' } });
      expect(
        toMatchConditionExpression({ ...condition, operator: '$gte' })
      ).to.deep.equal({ name: { $gte: 'Compass' } });
      expect(
        toMatchConditionExpression({ ...condition, operator: '$lt' })
      ).to.deep.equal({ name: { $lt: 'Compass' } });
      expect(
        toMatchConditionExpression({ ...condition, operator: '$lte' })
      ).to.deep.equal({ name: { $lte: 'Compass' } });
    });

    // Note: The purpose of this test is to ensure that we are doing type
    // casting of the values, wether it is correct or not is the responsibility
    // of hadron-type-checker and is tested there
    it('should cast the value to provided bsonType', function () {
      const condition = createCondition({
        field: 'name',
        value: '12',
        operator: '$ne',
        bsonType: 'Double',
      });

      expect(toMatchConditionExpression(condition)).to.deep.equal({
        name: { $ne: new Double(12) },
      });
    });
  });

  describe('#helpers - toMatchGroupExpression', function () {
    fixtures.forEach(function ([
      title,
      group,
      expectedVerboseExpression,
      expectedCompactExpression,
    ]) {
      context(`when group is a ${title}`, function () {
        it('should return a correct verbose clause for a MatchConditionGroup', function () {
          const verboseClause = toMatchGroupExpression(group);
          expect(verboseClause).to.deep.equal(expectedVerboseExpression);
        });

        it('should return a compact clause for a verbose clause', function () {
          const verboseClause = toMatchGroupExpression(group);
          const compactClause = makeCompactGroupExpression(verboseClause);
          expect(compactClause).to.deep.equal(expectedCompactExpression);
        });
      });
    });
  });

  describe('#component', function () {
    afterEach(cleanup);

    it('should call onChange with converted stage value', function () {
      const onChangeSpy = Sinon.spy();
      render(<MatchForm fields={SAMPLE_FIELDS} onChange={onChangeSpy} />);
      setComboboxValue(new RegExp(SINGLE_SELECT_LABEL, 'i'), 'name');
      expect(onChangeSpy.lastCall.args).deep.equal(["{\n name: ''\n}", null]);
    });

    it('should call onChange with an error if there was an error during the conversion to stage', function () {
      const onChangeSpy = Sinon.spy();
      render(<MatchForm fields={SAMPLE_FIELDS} onChange={onChangeSpy} />);
      // Setting the field to age will set the type to Double and without a
      // correct value the conversion will fail which is why we will get an
      // error
      setComboboxValue(new RegExp(SINGLE_SELECT_LABEL, 'i'), 'age');
      const [jsString, error] = onChangeSpy.lastCall.args;
      expect(jsString).to.equal('{}');
      expect(error.message).to.equal("Value '' is not a valid Double value");
    });
  });
});
