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
} from './match-condition-form';
import { SAMPLE_FIELDS } from './fixtures';
import type { CreateConditionFn } from './match-condition-form';
import type { CreateGroupFn, MatchGroupFormProps } from './match-group-form';
import { SINGLE_SELECT_LABEL } from '../field-combobox';
import { getNestingDepth } from './match';

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
        nestedGroups: [],
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
          nestingDepth={getNestingDepth(props?.group ?? group)}
          nestingLevel={0}
          onGroupChange={Sinon.spy()}
          {...props}
        />
      );
      return group;
    };

    describe('group header', function () {
      context('when group is rendered at nesting level 0', function () {
        it('should only render operator select and add nested group button', function () {
          const group = renderGroup({ nestingLevel: 0 });
          expect(
            screen.getByTestId(TEST_IDS.operatorSelect(group.id))
          ).to.exist;
          expect(
            screen.getByTestId(TEST_IDS.addNestedGroupBtn(group.id))
          ).to.exist;
          expect(() =>
            screen.getByTestId(TEST_IDS.removeGroupBtn(group.id))
          ).to.throw;
        });
      });

      context('when group is rendered at nesting level 1', function () {
        it('should render operator select, add nested group button and remove group button', function () {
          const group = renderGroup({ nestingLevel: 1 });
          expect(
            screen.getByTestId(TEST_IDS.operatorSelect(group.id))
          ).to.exist;
          expect(
            screen.getByTestId(TEST_IDS.addNestedGroupBtn(group.id))
          ).to.exist;
          expect(
            screen.getByTestId(TEST_IDS.removeGroupBtn(group.id))
          ).to.exist;
        });
      });

      context('when group is rendered at nesting level 2', function () {
        it('should render operator select, a disabled add nested group button and remove group button', function () {
          const group = renderGroup({ nestingLevel: 2 });
          expect(
            screen.getByTestId(TEST_IDS.operatorSelect(group.id))
          ).to.exist;
          const addNestedGroupBtn = screen.getByTestId(
            TEST_IDS.addNestedGroupBtn(group.id)
          );
          expect(addNestedGroupBtn.getAttribute('aria-disabled')).to.equal(
            'true'
          );
          expect(
            screen.getByTestId(TEST_IDS.removeGroupBtn(group.id))
          ).to.exist;
        });
      });
    });

    it('should render a form for group with relevant controls in place', function () {
      const group = renderGroup();
      expect(screen.getByTestId(TEST_IDS.container(group.id))).to.exist;
      expect(screen.getByTestId(TEST_IDS.operatorSelect(group.id))).to.exist;
      expect(screen.getByTestId(TEST_IDS.addNestedGroupBtn(group.id))).to.exist;
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

    it('should render a list of nested groups', function () {
      const nestedGroupA = createGroup();
      const nestedGroupB = createGroup();
      const group = createGroup({
        nestedGroups: [nestedGroupA, nestedGroupB],
      });
      renderGroup({ group });

      expect(screen.getByTestId(TEST_IDS.container(nestedGroupA.id))).to.exist;
      expect(screen.getByTestId(TEST_IDS.container(nestedGroupB.id))).to.exist;
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

    it('should call onGroupChange with an added nested group, when add nested group button is clicked', function () {
      const onGroupChangeSpy = Sinon.spy();
      const group = renderGroup({ onGroupChange: onGroupChangeSpy });

      userEvent.click(screen.getByTestId(TEST_IDS.addNestedGroupBtn(group.id)));

      expect(onGroupChangeSpy).to.be.calledOnce;
      const [changedGroup] = onGroupChangeSpy.lastCall.args;
      expect(changedGroup.nestedGroups).to.have.lengthOf(1);
    });

    it('should call onGroupChange with modified nested groups, when remove group button of nested group is clicked', function () {
      const onGroupChangeSpy = Sinon.spy();
      const nestedGroup = createGroup();
      const group = createGroup({
        nestedGroups: [nestedGroup],
      });
      renderGroup({
        group,
        onGroupChange: onGroupChangeSpy,
      });

      userEvent.click(
        screen.getByTestId(TEST_IDS.removeGroupBtn(nestedGroup.id))
      );

      expect(onGroupChangeSpy).to.be.calledOnce;
      const [changedGroup] = onGroupChangeSpy.lastCall.args;
      expect(changedGroup.nestedGroups).to.have.lengthOf(0);
    });

    it('should call onGroupChange with modified nested groups, when a nested group is modified', function () {
      const onGroupChangeSpy = Sinon.spy();
      const nestedGroup = createGroup();
      const group = createGroup({
        nestedGroups: [nestedGroup],
      });
      renderGroup({
        group,
        onGroupChange: onGroupChangeSpy,
      });

      expect(group.nestedGroups).to.have.lengthOf(1);
      expect(group.nestedGroups[0].nestedGroups).to.have.lengthOf(0);

      // This will add another nested group within our nested group
      userEvent.click(
        screen.getByTestId(TEST_IDS.addNestedGroupBtn(nestedGroup.id))
      );

      expect(onGroupChangeSpy).to.be.calledOnce;
      const [changedGroup] = onGroupChangeSpy.lastCall.args;
      expect(changedGroup.nestedGroups).to.have.lengthOf(1);
      expect(changedGroup.nestedGroups[0].nestedGroups).to.have.lengthOf(1);
    });

    it('should call onGroupChange with new set of conditions when a condition is added', function () {
      const conditionA = createCondition();
      const conditionB = createCondition();
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
