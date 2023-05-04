import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';
import { cleanup, render, screen, within } from '@testing-library/react';

import Group, { makeCreateGroup, TEST_IDS } from './group';
import { setComboboxValue } from '../../../../../test/form-helper';
import {
  makeCreateCondition,
  LABELS as CONDITION_LABELS,
  TEST_IDS as CONDITION_TEST_IDS,
  createCondition as createConditionPreScoped,
} from './condition';
import { SAMPLE_FIELDS } from './fixtures';
import type { CreateConditionFn } from './condition';
import type { CreateGroupFn, GroupProps } from './group';

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
      expect(createGroup({ conditions: [condition] })).to.deep.equal({
        id: 2,
        logicalOperator: '$and',
        conditions: [condition],
      });
    });
  });

  describe('#component - Group', function () {
    const renderGroup = (
      props?: Partial<GroupProps>,
      createGroup = makeCreateGroup(makeCreateCondition())
    ) => {
      const group = props?.group ?? createGroup();
      render(
        <Group
          key={group.id}
          fields={props?.fields ?? SAMPLE_FIELDS}
          group={group}
          onGroupChange={props?.onGroupChange ?? Sinon.spy()}
        />
      );
      return group;
    };

    it('should render a form for group with relevant controls in place', function () {
      const group = renderGroup();
      expect(screen.getByTestId(TEST_IDS.container(group.id))).to.exist;
      expect(screen.getByTestId(TEST_IDS.conditionsContainer(group.id))).to
        .exist;
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

    it('should call onGroupChange with new set of conditions when a condition is added', function () {
      const conditionA = createConditionPreScoped();
      const conditionB = createConditionPreScoped();
      const onGroupChangeSpy = Sinon.spy();
      const group = createGroup({
        conditions: [conditionA, conditionB],
      });
      renderGroup({ group, onGroupChange: onGroupChangeSpy });

      const addBtn = screen.getByTestId(
        CONDITION_TEST_IDS.addBtn(conditionA.id)
      );
      userEvent.click(addBtn);

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
      const removeBtn = screen.getByTestId(
        CONDITION_TEST_IDS.removeBtn(conditionA.id)
      );
      userEvent.click(removeBtn);

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
        new RegExp(CONDITION_LABELS.fieldCombobox, 'i'),
        '_id',
        screen.getByTestId(CONDITION_TEST_IDS.fieldCombobox(conditionA.id))
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

    describe('#component - GroupHeader', function () {
      it('should call onGroupChange when an operator is selected', function () {
        const onGroupChangeSpy = Sinon.spy();
        const group = renderGroup({ onGroupChange: onGroupChangeSpy });
        const operatorControl = within(
          screen.getByTestId(TEST_IDS.header(group.id))
        ).getByRole('tablist');

        userEvent.click(within(operatorControl).getByText(/Or/i));

        expect(onGroupChangeSpy).to.have.been.calledWithExactly({
          ...group,
          logicalOperator: '$or',
        });
      });
    });
  });
});
