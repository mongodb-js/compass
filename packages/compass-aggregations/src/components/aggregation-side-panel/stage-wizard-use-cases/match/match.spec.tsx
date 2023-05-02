import React from 'react';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';
import Sinon from 'sinon';

import { LABELS as CONDITION_LABELS, makeCreateCondition } from './condition';
import MatchForm, {
  areUniqueClauses,
  isNotEmptyCondition,
  makeCompactGroupClause,
  toConditionClause,
  toGroupClause,
} from './match';
import fixtures, { SAMPLE_FIELDS } from './fixtures';
import type { CreateConditionFn } from './condition';
import { LABELS as GROUP_LABELS } from './group';
import { setComboboxValue } from '../../../../../test/form-helper';

describe('match', function () {
  let createCondition: CreateConditionFn;
  beforeEach(function () {
    createCondition = makeCreateCondition();
  });

  describe('#helpers - isNotEmptyCondition', function () {
    it('should true when a condition have both field and bsonType', function () {
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
      expect(
        isNotEmptyCondition(
          createCondition({
            field: 'name',
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
      expect(isNotEmptyCondition(createCondition())).to.be.false;
    });
  });

  describe('#helpers - areUniqueClauses', function () {
    it('should return true if keys of all the clauses in the provided list are unique otherwise false', function () {
      expect(areUniqueClauses([{ name: 'Compass' }, { version: 'Standalone' }]))
        .to.be.true;

      expect(
        areUniqueClauses([
          { name: 'Compass' },
          { version: 'Standalone' },
          { name: 'Something-else' },
        ])
      ).to.be.false;

      expect(
        areUniqueClauses([
          { name: 'Compass' },
          { version: 'Standalone' },
          { $and: [] },
        ])
      ).to.be.true;

      expect(
        areUniqueClauses([
          { $and: [{ name: 'Compass' }, { version: 'Standalone' }] },
          { $and: [] },
        ])
      ).to.be.false;
    });
  });

  describe('#helpers - toConditionClause', function () {
    it('should return a concise clause when operator is $eq', function () {
      const condition = createCondition({
        field: 'name',
        value: 'Compass',
        operator: '$eq',
        bsonType: 'String',
      });

      expect(toConditionClause(condition)).to.deep.equal({ name: 'Compass' });
    });

    it('should return a verbose clause when operator anything but $eq', function () {
      const condition = createCondition({
        field: 'name',
        value: 'Compass',
        operator: '$ne',
        bsonType: 'String',
      });

      expect(toConditionClause(condition)).to.deep.equal({
        name: { $ne: 'Compass' },
      });
      expect(
        toConditionClause({ ...condition, operator: '$gt' })
      ).to.deep.equal({ name: { $gt: 'Compass' } });
      expect(
        toConditionClause({ ...condition, operator: '$gte' })
      ).to.deep.equal({ name: { $gte: 'Compass' } });
      expect(
        toConditionClause({ ...condition, operator: '$lt' })
      ).to.deep.equal({ name: { $lt: 'Compass' } });
      expect(
        toConditionClause({ ...condition, operator: '$lte' })
      ).to.deep.equal({ name: { $lte: 'Compass' } });
    });
  });

  describe('#helpers - toGroupClause', function () {
    fixtures.forEach(function ([
      title,
      group,
      expectedVerboseClause,
      expectedCompactClause,
    ]) {
      context(`when group is a ${title}`, function () {
        it('should return a correct verbose clause for a MatchConditionGroup', function () {
          const verboseClause = toGroupClause(group);
          expect(verboseClause).to.deep.equal(expectedVerboseClause);
        });

        it('should return a compact clause for a verbose clause', function () {
          const verboseClause = toGroupClause(group);
          const compactClause = makeCompactGroupClause(verboseClause);
          expect(compactClause).to.deep.equal(expectedCompactClause);
        });
      });
    });
  });

  describe('#component', function () {
    afterEach(cleanup);

    it('should render a group component with nesting level of 0', function () {
      render(<MatchForm fields={SAMPLE_FIELDS} onChange={Sinon.spy()} />);

      const removeGroupBtn = screen.getByLabelText(
        new RegExp(GROUP_LABELS.removeGroupBtn, 'i')
      );
      expect(removeGroupBtn.getAttribute('aria-disabled')).to.equal('true');
    });

    it('should call onChange with converted stage value', function () {
      const onChangeSpy = Sinon.spy();
      render(<MatchForm fields={SAMPLE_FIELDS} onChange={onChangeSpy} />);
      setComboboxValue(new RegExp(CONDITION_LABELS.fieldCombobox, 'i'), 'name');
      expect(onChangeSpy.lastCall.args).deep.equal(["{\n name: ''\n}", null]);
    });

    it('should call onChange with an error if there was an error during the conversion to stage', function () {
      const onChangeSpy = Sinon.spy();
      render(<MatchForm fields={SAMPLE_FIELDS} onChange={onChangeSpy} />);
      // Setting the field to age will set the type to Double and without a
      // correct value the conversion will fail which is why we will get an
      // error
      setComboboxValue(new RegExp(CONDITION_LABELS.fieldCombobox, 'i'), 'age');
      const [jsString, error] = onChangeSpy.lastCall.args;
      expect(jsString).to.equal('{}');
      expect(error.message).to.equal("Value '' is not a valid Double value");
    });
  });
});
