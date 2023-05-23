import React from 'react';
import { expect } from 'chai';
import { render, cleanup } from '@testing-library/react';
import Sinon from 'sinon';
import { Double } from 'bson';

import { makeCreateCondition } from './match-condition-form';
import MatchForm, {
  areUniqueExpressions,
  getNestingDepth,
  isNotEmptyCondition,
  isNotEmptyGroup,
  makeCompactGroupExpression,
  toMatchConditionExpression,
  toMatchGroupExpression,
} from './match';
import fixtures, { SAMPLE_FIELDS } from './fixtures';
import { setComboboxValue } from '../../../../../test/form-helper';
import type { CreateConditionFn } from './match-condition-form';
import type { TypeCastTypes } from 'hadron-type-checker';
import { SINGLE_SELECT_LABEL } from '../field-combobox';
import { makeCreateGroup } from './match-group-form';
import type { CreateGroupFn } from './match-group-form';

describe('match', function () {
  let createCondition: CreateConditionFn;
  let createGroup: CreateGroupFn;
  beforeEach(function () {
    createCondition = makeCreateCondition();
    createGroup = makeCreateGroup(createCondition);
  });

  describe('#helpers - getNestingDepth', function () {
    it('should return 0 when there are no nested groups', function () {
      expect(getNestingDepth(createGroup())).to.equal(0);
    });

    it('should return the correct max nesting depth as per the number of groups deeply nested', function () {
      expect(
        getNestingDepth(
          createGroup({
            nestedGroups: [createGroup()],
          })
        )
      ).to.equal(1);

      expect(
        getNestingDepth(
          createGroup({
            nestedGroups: [
              createGroup({
                nestedGroups: [createGroup()],
              }),
            ],
          })
        )
      ).to.equal(2);

      expect(
        getNestingDepth(
          createGroup({
            nestedGroups: [
              createGroup(),
              createGroup({
                nestedGroups: [
                  createGroup({
                    nestedGroups: [createGroup()],
                  }),
                ],
              }),
            ],
          })
        )
      ).to.equal(3);
    });
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

  describe('#helpers - isNotEmptyGroup', function () {
    it('should return false when a group has empty conditions and empty nested groups', function () {
      // Empty conditions - by default has empty condition
      expect(isNotEmptyGroup(createGroup())).to.be.false;

      // Empty conditions - three condition but all are empty
      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [
              createCondition(),
              createCondition({ field: 'something', bsonType: '' as any }),
              createCondition({ field: '', bsonType: 'String' }),
            ],
          })
        )
      ).to.be.false;

      // Empty groups - has empty condition and empty nested group (because empty condition)
      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [createCondition()],
            nestedGroups: [createGroup()],
          })
        )
      ).to.be.false;

      // Empty groups - has empty condition and empty nested group (because empty condition and empty nested-nested group)
      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [createCondition()],
            nestedGroups: [
              createGroup({
                nestedGroups: [createGroup()],
              }),
            ],
          })
        )
      ).to.be.false;
    });

    it('should return true when a group has at-least one non-empty condition or nested group', function () {
      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [
              createCondition(), // Empty condition
              createCondition({ field: 'name', bsonType: 'String' }), // Non-empty condition
            ],
          })
        )
      ).to.be.true;

      expect(
        isNotEmptyGroup(
          createGroup({
            conditions: [
              createCondition(), // Empty condition
            ],
            nestedGroups: [
              createGroup(), // Empty nested group
              createGroup({
                conditions: [
                  createCondition({ field: 'name', bsonType: 'String' }), // Non-empty condition in nested group
                ],
              }),
            ],
          })
        )
      ).to.be.true;
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
