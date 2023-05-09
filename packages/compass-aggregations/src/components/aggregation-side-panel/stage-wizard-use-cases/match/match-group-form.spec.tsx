import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen, within } from '@testing-library/react';

import Group, { makeCreateGroup, TEST_IDS } from './match-group-form';
import { setComboboxValue } from '../../../../../test/form-helper';
import {
  makeCreateCondition,
  TEST_IDS as CONDITION_TEST_IDS,
  createCondition as createConditionPreScoped,
} from './match-condition-form';
import { SAMPLE_FIELDS } from './fixtures';
import type { CreateConditionFn } from './match-condition-form';
import type { CreateGroupFn, MatchGroupFormProps } from './match-group-form';
import { SINGLE_SELECT_LABEL } from '../field-combobox';

describe('group', function () {
  let createCondition: CreateConditionFn;
  let createGroup: CreateGroupFn;

  afterEach(cleanup);

  beforeEach(function () {
    createCondition = makeCreateCondition();
    createGroup = makeCreateGroup(createCondition);
  });

  describe('#helpers - createGroup', function () {
    it('should return a group object with an incremental id', function () {
      expect(createGroup().id).to.equal(1);
      expect(createGroup().id).to.equal(2);
    });

    it('should return a an empty group object when no data is provided', function () {
      expect(createGroup()).to.deep.equal({
        id: 1,
        logicalOperator: '$and',
        conditions: [
          {
            id: 1,
            field: '',
            operator: '$eq',
            value: '',
            bsonType: 'String',
          },
        ],
      });
    });

    it('should return a group object with partial data applied to it', function () {
      const condition = createCondition({
        field: 'name',
        operator: '$ne',
        value: 'Compass',
        bsonType: 'String',
      });

      expect(createGroup({ logicalOperator: '$or' }).logicalOperator).equal(
        '$or'
      );
      expect(createGroup({ conditions: [condition] }).conditions).to.deep.equal(
        [condition]
      );
    });
  });

  describe('#component - Group', function () {
    const renderGroup = (
      props?: Partial<MatchGroupFormProps>,
      createGroup = makeCreateGroup(makeCreateCondition())
    ) => {
      const group = createGroup();
      render(
        <Group
          key={group.id}
          fields={SAMPLE_FIELDS}
          group={group}
          onGroupChange={Sinon.spy()}
          {...props}
        />
      );
      return group;
    };

    it('should render a form for group with relevant controls in place', function () {
      const group = renderGroup();
      expect(screen.getByTestId(TEST_IDS.container(group.id))).to.exist;
      expect(screen.getByTestId(TEST_IDS.operatorSelect(group.id))).to.exist;
      expect(
        screen.queryAllByTestId(TEST_IDS.removeConditionBtn())
      ).to.have.lengthOf(0);
      expect(
        screen.getAllByTestId(TEST_IDS.addConditionBtn())
      ).to.have.lengthOf(1);
    });

    it('should render a list of conditions', function () {
      const conditionA = createCondition();
      const conditionB = createCondition();
      const group = createGroup({
        conditions: [conditionA, conditionB],
      });
      renderGroup({ group });

      expect(screen.getByTestId(CONDITION_TEST_IDS.condition(conditionA.id))).to
        .exist;
      expect(screen.getByTestId(CONDITION_TEST_IDS.condition(conditionB.id))).to
        .exist;
    });

    it('should call onGroupChange when an operator is selected', function () {
      const onGroupChangeSpy = Sinon.spy();
      const group = renderGroup({ onGroupChange: onGroupChangeSpy });
      const operatorControl = within(
        screen.getByTestId(TEST_IDS.operatorSelect(group.id))
      ).getByRole('tablist');

      userEvent.click(within(operatorControl).getByText(/Or/i));

      expect(onGroupChangeSpy).to.have.been.calledWithExactly({
        ...group,
        logicalOperator: '$or',
      });
    });

    it('should call onGroupChange with new set of conditions when a condition is added', function () {
      const conditionA = createConditionPreScoped();
      const conditionB = createConditionPreScoped();
      const onGroupChangeSpy = Sinon.spy();
      const group = createGroup({
        conditions: [conditionA, conditionB],
      });
      renderGroup({ group, onGroupChange: onGroupChangeSpy });

      const addBtns = screen.getAllByTestId(TEST_IDS.addConditionBtn());
      userEvent.click(addBtns[0]);

      expect(onGroupChangeSpy).to.have.been.calledWith({
        ...group,
        conditions: [
          conditionA,
          { id: 3, field: '', operator: '$eq', value: '', bsonType: 'String' },
          conditionB,
        ],
      });
    });

    it('should call onGroupChange with remaining set of conditions when a condition is removed', function () {
      const conditionA = createCondition();
      const conditionB = createCondition();
      const onGroupChangeSpy = Sinon.spy();
      const group = createGroup({
        conditions: [conditionA, conditionB],
      });
      renderGroup({ group, onGroupChange: onGroupChangeSpy });
      const removeBtns = screen.getAllByTestId(TEST_IDS.removeConditionBtn());
      userEvent.click(removeBtns[0]);

      expect(onGroupChangeSpy).to.have.been.calledWith({
        ...group,
        conditions: [conditionB],
      });
    });

    it('should call onGroupChange with modified set of conditions when a condition is changed', function () {
      const conditionA = createCondition();
      const onGroupChangeSpy = Sinon.spy();
      const group = createGroup({
        conditions: [conditionA],
      });
      renderGroup({ group, onGroupChange: onGroupChangeSpy });

      setComboboxValue(
        new RegExp(SINGLE_SELECT_LABEL, 'i'),
        '_id',
        screen.getByTestId(CONDITION_TEST_IDS.condition(conditionA.id))
      );

      expect(onGroupChangeSpy).to.have.been.calledWith({
        ...group,
        conditions: [
          {
            ...conditionA,
            field: '_id',
            bsonType: 'ObjectId',
          },
        ],
      });
    });
  });
});
