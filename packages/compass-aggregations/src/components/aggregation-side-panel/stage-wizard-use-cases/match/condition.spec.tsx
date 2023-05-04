import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';
import { render, screen, cleanup } from '@testing-library/react';

import Condition, { LABELS, TEST_IDS, makeCreateCondition } from './condition';
import {
  setComboboxValue,
  setInputElementValue,
  setSelectValue,
} from '../../../../../test/form-helper';
import { SAMPLE_FIELDS } from './fixtures';
import type { ConditionProps, CreateConditionFn } from './condition';

const renderCondition = (
  props: Partial<ConditionProps>,
  createCondition: CreateConditionFn
) => {
  render(
    <Condition
      fields={SAMPLE_FIELDS}
      disableRemoveBtn={false}
      condition={createCondition(props.condition)}
      onConditionChange={Sinon.spy()}
      onAddConditionClick={Sinon.spy()}
      onRemoveConditionClick={Sinon.spy()}
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
      renderCondition({ condition }, createCondition);
      expect(screen.getByTestId(TEST_IDS.fieldCombobox(condition.id))).to.exist;

      expect(screen.getByTestId(TEST_IDS.operatorSelect(condition.id))).to
        .exist;

      expect(screen.getByTestId(TEST_IDS.operatorSelect(condition.id))).to
        .exist;

      expect(screen.getByTestId(TEST_IDS.valueInput(condition.id))).to.exist;

      expect(screen.getByTestId(TEST_IDS.addBtn(condition.id))).to.exist;

      expect(screen.getByTestId(TEST_IDS.removeBtn(condition.id))).to.exist;
    });

    it('should call onConditionChange with updated condition when a field is selected', function () {
      const condition = createCondition();
      const onChangeSpy = Sinon.spy();
      renderCondition(
        { condition, onConditionChange: onChangeSpy },
        createCondition
      );

      const fieldCombobox = screen.getByTestId(
        TEST_IDS.fieldCombobox(condition.id)
      );

      setComboboxValue(
        new RegExp(LABELS.fieldCombobox, 'i'),
        '_id',
        fieldCombobox
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        field: '_id',
        bsonType: 'ObjectId',
      });

      setComboboxValue(
        new RegExp(LABELS.fieldCombobox, 'i'),
        'age',
        fieldCombobox
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        field: 'age',
        bsonType: 'Double',
      });
    });

    it('should call onConditionChange with updated condition when an operator selected', function () {
      const condition = createCondition();
      const onChangeSpy = Sinon.spy();
      renderCondition(
        { condition, onConditionChange: onChangeSpy },
        createCondition
      );

      const operatorSelect = screen.getByTestId(
        TEST_IDS.operatorSelect(condition.id)
      );

      setSelectValue(
        new RegExp(LABELS.operatorSelect, 'i'),
        '!=',
        operatorSelect
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        operator: '$ne',
      });

      setSelectValue(
        new RegExp(LABELS.operatorSelect, 'i'),
        '>=',
        operatorSelect
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        operator: '$gte',
      });
    });

    it('should call onConditionChange with updated condition when a value is typed', function () {
      const condition = createCondition();
      const onChangeSpy = Sinon.spy();
      renderCondition(
        { condition, onConditionChange: onChangeSpy },
        createCondition
      );

      const valueInput = screen.getByTestId(TEST_IDS.valueInput(condition.id));

      setInputElementValue(
        new RegExp(LABELS.valueInput, 'i'),
        'Compass',
        valueInput
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
      renderCondition(
        { condition, onConditionChange: onChangeSpy },
        createCondition
      );

      const typeSelect = screen.getByTestId(TEST_IDS.typeSelect(condition.id));

      setSelectValue(new RegExp(LABELS.typeSelect, 'i'), 'Double', typeSelect);
      expect(onChangeSpy).to.be.calledWithExactly({
        ...condition,
        bsonType: 'Double',
      });
    });

    it('should call onAddConditionClick on click of Add condition button', function () {
      const condition = createCondition();
      const onAddConditionClickSpy = Sinon.spy();
      renderCondition(
        {
          condition,
          onAddConditionClick: onAddConditionClickSpy,
        },
        createCondition
      );
      userEvent.click(screen.getByTestId(TEST_IDS.addBtn(condition.id)));

      expect(onAddConditionClickSpy).to.have.been.calledOnce;
    });

    it('should call onRemoveConditionClick on click of Remove condition button', function () {
      const condition = createCondition();
      const onRemoveConditionClickSpy = Sinon.spy();
      renderCondition(
        {
          condition,
          onRemoveConditionClick: onRemoveConditionClickSpy,
        },
        createCondition
      );
      userEvent.click(screen.getByTestId(TEST_IDS.removeBtn(condition.id)));

      expect(onRemoveConditionClickSpy).to.have.been.calledOnce;
    });
  });
});
