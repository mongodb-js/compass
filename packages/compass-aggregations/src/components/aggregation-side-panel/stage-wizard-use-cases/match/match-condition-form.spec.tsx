import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';

import Condition, {
  LABELS,
  TEST_IDS,
  makeCreateCondition,
} from './match-condition-form';
import {
  setComboboxValue,
  setInputElementValue,
  setSelectValue,
} from '../../../../../test/form-helper';
import { SAMPLE_FIELDS } from './fixtures';
import type {
  MatchConditionFormProps,
  CreateConditionFn,
} from './match-condition-form';
import { SINGLE_SELECT_LABEL } from '../field-combobox';

const renderCondition = (props: Partial<MatchConditionFormProps>) => {
  const condition = props.condition ?? makeCreateCondition()();
  render(
    <Condition
      fields={SAMPLE_FIELDS}
      condition={condition}
      onConditionChange={Sinon.spy()}
      {...props}
    />
  );
};

describe('condition', function () {
  let createCondition: CreateConditionFn;

  beforeEach(function () {
    createCondition = makeCreateCondition();
  });

  afterEach(cleanup);

  describe('#helpers - createCondition', function () {
    it('should return a condition object with an incremental id', function () {
      expect(createCondition().id).to.equal(1);
      expect(createCondition().id).to.equal(2);
    });

    it('should return a an empty condition object when no data is provided', function () {
      expect(createCondition()).to.deep.equal({
        id: 1,
        field: '',
        operator: '$eq',
        value: '',
        bsonType: 'String',
      });
    });

    it('should return a condition object with partial data applied to it', function () {
      expect(createCondition({ field: 'name' }).field).equal('name');
      expect(createCondition({ operator: '$ne' }).operator).equal('$ne');
      expect(createCondition({ value: 'Compass' }).value).equal('Compass');
      expect(createCondition({ bsonType: 'ObjectId' }).bsonType).equal(
        'ObjectId'
      );
    });
  });

  describe('#component', function () {
    it('should render a set of fields and controls for a condition', function () {
      const condition = createCondition();
      renderCondition({ condition });
      expect(screen.getByLabelText(new RegExp(SINGLE_SELECT_LABEL, 'i'))).to
        .exist;
      expect(screen.getByLabelText(LABELS.operatorSelect)).to.exist;
      expect(screen.getByLabelText(LABELS.valueInput)).to.exist;
      expect(screen.getByLabelText(LABELS.typeSelect)).to.exist;
    });

    it('should call onConditionChange with updated condition when a field is selected', function () {
      const condition = createCondition();
      const onChangeSpy = Sinon.spy();
      renderCondition({ condition, onConditionChange: onChangeSpy });

      const conditionContainer = screen.getByTestId(
        TEST_IDS.condition(condition.id)
      );

      setComboboxValue(
        new RegExp(SINGLE_SELECT_LABEL, 'i'),
        '_id',
        conditionContainer
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        field: '_id',
        bsonType: 'ObjectId',
      });

      setComboboxValue(
        new RegExp(SINGLE_SELECT_LABEL, 'i'),
        'age',
        conditionContainer
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        field: 'age',
        bsonType: 'Double',
      });
    });

    it('should call onConditionChange with updated condition when an operator is selected', function () {
      const condition = createCondition();
      const onChangeSpy = Sinon.spy();
      renderCondition({ condition, onConditionChange: onChangeSpy });

      const conditionContainer = screen.getByTestId(
        TEST_IDS.condition(condition.id)
      );

      setSelectValue(
        new RegExp(LABELS.operatorSelect, 'i'),
        '!=',
        conditionContainer
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        operator: '$ne',
      });

      setSelectValue(
        new RegExp(LABELS.operatorSelect, 'i'),
        '>=',
        conditionContainer
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        operator: '$gte',
      });
    });

    it('should call onConditionChange with updated condition when a value is typed', function () {
      const condition = createCondition();
      const onChangeSpy = Sinon.spy();
      renderCondition({ condition, onConditionChange: onChangeSpy });

      const conditionContainer = screen.getByTestId(
        TEST_IDS.condition(condition.id)
      );

      setInputElementValue(
        new RegExp(LABELS.valueInput, 'i'),
        'Compass',
        conditionContainer
      );
      // Need to do this because input's value is bound to prop and that is not
      // getting updated
      const value = onChangeSpy
        .getCalls()
        .map(({ args }) => {
          const condition = args[0];
          return condition.value;
        })
        .join('');
      expect(value).to.equal('Compass');
    });

    it('should call onConditionChange with updated condition when a type is selected', function () {
      const condition = createCondition();
      const onChangeSpy = Sinon.spy();
      renderCondition({ condition, onConditionChange: onChangeSpy });

      const conditionContainer = screen.getByTestId(
        TEST_IDS.condition(condition.id)
      );

      setSelectValue(
        new RegExp(LABELS.typeSelect, 'i'),
        'Double',
        conditionContainer
      );
      expect(onChangeSpy).to.be.calledWithExactly({
        ...condition,
        bsonType: 'Double',
      });
    });
  });
});
