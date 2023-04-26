import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';

import Condition, {
  FIELD_SELECT_LABEL,
  OPERATOR_SELECT_LABEL,
  TYPE_SELECT_LABEL,
  VALUE_INPUT_LABEL,
  createCondition,
} from './condition';
import type { ConditionProps } from './condition';
import type { Fields } from '..';
import {
  setComboboxValue,
  setInputElementValue,
  setSelectValue,
} from '../../../../../test/form-helper';
import userEvent from '@testing-library/user-event';

const SAMPLE_FIELDS: Fields = [
  {
    name: '_id',
    type: 'ObjectId',
  },
  {
    name: 'name',
    type: 'String',
  },
  {
    name: 'age',
    type: 'Double',
  },
  {
    name: 'isActive',
    type: 'Boolean',
  },
  {
    name: 'doj',
    type: 'Date',
  },
];

const renderCondition = (props?: Partial<ConditionProps>) => {
  render(
    <Condition
      fields={SAMPLE_FIELDS}
      disableRemoveBtn={false}
      condition={createCondition(props?.condition)}
      onConditionChange={Sinon.spy()}
      onAddConditionClick={Sinon.spy()}
      onRemoveConditionClick={Sinon.spy()}
      {...props}
    />
  );
};

describe.only('condition', function () {
  afterEach(cleanup);

  describe('#helpers - createCondition', function () {
    it('should return a condition object with an incremental id', function () {
      expect(createCondition().id).to.equal(1);
      expect(createCondition().id).to.equal(2);
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
      expect(
        screen.getByTestId(`match-condition-${condition.id}-field-combobox`)
      ).to.exist;

      expect(
        screen.getByTestId(`match-condition-${condition.id}-operator-select`)
      ).to.exist;

      expect(screen.getByTestId(`match-condition-${condition.id}-value-input`))
        .to.exist;

      expect(screen.getByTestId(`match-condition-${condition.id}-type-select`))
        .to.exist;

      expect(screen.getByTestId(`match-condition-${condition.id}-add`)).to
        .exist;

      expect(screen.getByTestId(`match-condition-${condition.id}-remove`)).to
        .exist;
    });

    it('should call onConditionChange with updated condition when a field is selected', function () {
      const condition = createCondition();
      const onChangeSpy = Sinon.spy();
      renderCondition({ condition, onConditionChange: onChangeSpy });

      const fieldCombobox = screen.getByTestId(
        `match-condition-${condition.id}-field-combobox`
      );

      setComboboxValue(
        new RegExp(FIELD_SELECT_LABEL, 'i'),
        '_id',
        fieldCombobox
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        field: '_id',
        bsonType: 'ObjectId',
      });

      setComboboxValue(
        new RegExp(FIELD_SELECT_LABEL, 'i'),
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
      renderCondition({ condition, onConditionChange: onChangeSpy });

      const operatorSelect = screen.getByTestId(
        `match-condition-${condition.id}-operator-select`
      );

      setSelectValue(
        new RegExp(OPERATOR_SELECT_LABEL, 'i'),
        '!=',
        operatorSelect
      );
      expect(onChangeSpy.lastCall).to.be.calledWithExactly({
        ...condition,
        operator: '$ne',
      });

      setSelectValue(
        new RegExp(OPERATOR_SELECT_LABEL, 'i'),
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
      renderCondition({ condition, onConditionChange: onChangeSpy });

      const valueInput = screen.getByTestId(
        `match-condition-${condition.id}-value-input`
      );

      setInputElementValue(
        new RegExp(VALUE_INPUT_LABEL, 'i'),
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
      renderCondition({ condition, onConditionChange: onChangeSpy });

      const typeSelect = screen.getByTestId(
        `match-condition-${condition.id}-type-select`
      );

      setSelectValue(new RegExp(TYPE_SELECT_LABEL, 'i'), 'Double', typeSelect);
      expect(onChangeSpy).to.be.calledWithExactly({
        ...condition,
        bsonType: 'Double',
      });
    });

    it('should call onAddConditionClick on click of Add condition button', function () {
      const condition = createCondition();
      const onAddConditionClickSpy = Sinon.spy();
      renderCondition({
        condition,
        onAddConditionClick: onAddConditionClickSpy,
      });
      userEvent.click(
        screen.getByTestId(`match-condition-${condition.id}-add`)
      );

      expect(onAddConditionClickSpy).to.have.been.calledOnce;
    });

    it('should call onRemoveConditionClick on click of Remove condition button', function () {
      const condition = createCondition();
      const onRemoveConditionClickSpy = Sinon.spy();
      renderCondition({
        condition,
        onRemoveConditionClick: onRemoveConditionClickSpy,
      });
      userEvent.click(
        screen.getByTestId(`match-condition-${condition.id}-remove`)
      );

      expect(onRemoveConditionClickSpy).to.have.been.calledOnce;
    });
  });
});
