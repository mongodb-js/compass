import React from 'react';
import Sinon from 'sinon';
import { expect } from 'chai';
import { cleanup, render, screen, within } from '@testing-library/react';

import Group, { makeCreateGroup, makeGroupsHandlers } from './group';
import { FIELD_SELECT_LABEL, makeCreateCondition } from './condition';
import type { CreateConditionFn } from './condition';
import type { CreateGroupFn, GroupProps } from './group';
import type { MatchConditionGroup, MatchConditionGroups } from './match';
import type { Fields } from '..';
import userEvent from '@testing-library/user-event';
import { setComboboxValue } from '../../../../../test/form-helper';

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
            bsonType: '',
          },
        ],
        groups: [],
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
        groups: [],
      });

      expect(
        createGroup({
          groups: [
            createGroup({
              conditions: [condition],
            }),
          ],
        })
      ).to.deep.equal({
        id: 4,
        logicalOperator: '$and',
        // this because there is always an empty condition created when a group is created
        conditions: [
          { id: 5, field: '', operator: '$eq', value: '', bsonType: '' },
        ],
        groups: [
          {
            id: 3,
            logicalOperator: '$and',
            conditions: [condition],
            groups: [],
          },
        ],
      });
    });
  });

  describe('#helpers - makeGroupsHandlers', function () {
    it('should return a map of methods to handle operations on groups', function () {
      const groupHandlers = makeGroupsHandlers([], () => {});
      expect('handleGroupChange' in groupHandlers).to.be.true;
      expect('handleRemoveGroupClick' in groupHandlers).to.be.true;
      expect('handleAddGroupClick' in groupHandlers).to.be.true;
    });

    describe('handleGroupChange', function () {
      it('should do nothing when provided groupIdx does not exists in groups', function () {
        const onChangeSpy = Sinon.spy();
        const groupHandlers = makeGroupsHandlers([], onChangeSpy);

        groupHandlers.handleGroupChange(0, createGroup());
        expect(onChangeSpy).to.not.be.called;
      });

      it('should replace the group at provided groupIdx and return a list of new groups', function () {
        const onChangeSpy = Sinon.spy();
        const oldGroups: MatchConditionGroups = [
          createGroup({ logicalOperator: '$and' }),
        ];
        const groupHandlers = makeGroupsHandlers(oldGroups, onChangeSpy);

        const newGroup: MatchConditionGroup = createGroup({
          logicalOperator: '$or',
        });
        groupHandlers.handleGroupChange(0, newGroup);
        expect(onChangeSpy).to.be.calledWithExactly([newGroup]);
      });

      it('should change the operator of already present group when new group has an operator same as other group and return a list of new groups', function () {
        const onChangeSpy = Sinon.spy();
        const groupA = createGroup({ logicalOperator: '$and' });
        const groupB = createGroup({ logicalOperator: '$or' });
        const oldGroups: MatchConditionGroups = [groupA, groupB];
        const groupHandlers = makeGroupsHandlers(oldGroups, onChangeSpy);

        const changedGroupA: MatchConditionGroup = createGroup({
          logicalOperator: '$or',
        });
        groupHandlers.handleGroupChange(0, changedGroupA);
        expect(onChangeSpy.lastCall).to.be.calledWithExactly([
          changedGroupA,
          { ...groupB, logicalOperator: '$and' },
        ]);

        const changedGroupB: MatchConditionGroup = createGroup({
          logicalOperator: '$or',
        });
        groupHandlers.handleGroupChange(1, changedGroupB);
        expect(onChangeSpy.lastCall).to.be.calledWithExactly([
          { ...groupA, logicalOperator: '$and' },
          changedGroupB,
        ]);
      });
    });

    describe('handleGroupRemoveClick', function () {
      it('should do nothing when provided groupIdx does not exists in groups', function () {
        const onChangeSpy = Sinon.spy();
        const groupHandlers = makeGroupsHandlers([], onChangeSpy);

        groupHandlers.handleRemoveGroupClick(0);
        expect(onChangeSpy).to.not.be.called;
      });

      it('should remove the group at provided groupIdx and return a list of remaining groups', function () {
        const onChangeSpy = Sinon.spy();
        const groupA = createGroup({ logicalOperator: '$and' });
        const groupB = createGroup({ logicalOperator: '$or' });
        const oldGroups: MatchConditionGroups = [groupA, groupB];
        const groupHandlers = makeGroupsHandlers(oldGroups, onChangeSpy);

        groupHandlers.handleRemoveGroupClick(1);
        expect(onChangeSpy.lastCall).to.be.calledWithExactly([groupA]);

        groupHandlers.handleRemoveGroupClick(0);
        expect(onChangeSpy.lastCall).to.be.calledWithExactly([groupB]);
      });
    });

    describe('handleAddGroupClick', function () {
      it('should do nothing when groups is already have two members', function () {
        const onChangeSpy = Sinon.spy();
        const groupA = createGroup({ logicalOperator: '$and' });
        const groupB = createGroup({ logicalOperator: '$or' });
        const oldGroups: MatchConditionGroups = [groupA, groupB];
        const groupHandlers = makeGroupsHandlers(oldGroups, onChangeSpy);

        groupHandlers.handleAddGroupClick();
        expect(onChangeSpy).to.not.be.called;
      });

      it('should simply add an empty group at the end of the list and return a new list', function () {
        const onChangeSpy = Sinon.spy();
        const groupHandlers = makeGroupsHandlers([], onChangeSpy);

        groupHandlers.handleAddGroupClick();
        expect(onChangeSpy).to.be.called.calledWithExactly([
          {
            id: 1,
            logicalOperator: '$and',
            conditions: [
              {
                id: 1,
                field: '',
                operator: '$eq',
                value: '',
                bsonType: '',
              },
            ],
            groups: [],
          },
        ]);
      });

      it('should add an empty group at the end of the list while making sure that the operator is not same as the operator of already present group', function () {
        const onChangeSpy = Sinon.spy();
        const groupA = createGroup({ logicalOperator: '$and' });
        const oldGroups: MatchConditionGroups = [groupA];
        const groupHandlers = makeGroupsHandlers(oldGroups, onChangeSpy);

        groupHandlers.handleAddGroupClick();
        expect(onChangeSpy.lastCall).to.be.calledWithExactly([
          groupA,
          {
            id: 2,
            logicalOperator: '$or',
            conditions: [
              {
                id: 2,
                field: '',
                operator: '$eq',
                value: '',
                bsonType: '',
              },
            ],
            groups: [],
          },
        ]);
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
          nestingLevel={props?.nestingLevel ?? 0}
          disableAddGroup={props?.disableAddGroup ?? false}
          disableRemoveGroup={props?.disableRemoveGroup ?? false}
          group={group}
          onGroupChange={props?.onGroupChange ?? Sinon.spy()}
          onRemoveGroupClick={props?.onRemoveGroupClick ?? Sinon.spy()}
          onAddGroupClick={props?.onAddGroupClick ?? Sinon.spy()}
        />
      );
      return group;
    };

    it('should render a form for group with relevant controls in place', function () {
      const group = renderGroup();
      expect(screen.getByTestId(`match-group-${group.id}`)).to.exist;

      expect(screen.getByTestId(`match-group-${group.id}-header`)).to.exist;
      expect(screen.getByTestId(`match-group-${group.id}-conditions`)).to.exist;
      expect(screen.getByTestId(`match-group-${group.id}-nested-groups`)).to
        .exist;
      expect(screen.getByTestId(`match-group-${group.id}-footer`)).to.exist;
    });

    it('should render a list of conditions', function () {
      const conditionA = createCondition();
      const conditionB = createCondition();
      const group = createGroup({
        conditions: [conditionA, conditionB],
      });
      renderGroup({ group });

      expect(screen.getByTestId(`match-condition-${conditionA.id}`)).to.exist;
      expect(screen.getByTestId(`match-condition-${conditionB.id}`)).to.exist;
    });

    it('should render a list of nested groups', function () {
      const subGroupA = createGroup();
      const subGroupB = createGroup();
      const group = createGroup({
        groups: [subGroupA, subGroupB],
      });

      renderGroup({ group });

      expect(screen.getByTestId(`match-group-${subGroupA.id}`)).to.exist;
      expect(screen.getByTestId(`match-group-${subGroupB.id}`)).to.exist;
    });

    it('should call onGroupChange with new set of conditions when a condition is added', function () {
      const conditionA = createCondition();
      const conditionB = createCondition();
      const onGroupChangeSpy = Sinon.spy();
      const group = createGroup({
        conditions: [conditionA, conditionB],
      });
      renderGroup({ group, onGroupChange: onGroupChangeSpy });
      expect(screen.getByTestId(`match-condition-${conditionA.id}`)).to.exist;
      expect(screen.getByTestId(`match-condition-${conditionB.id}`)).to.exist;

      const removeBtn = within(
        screen.getByTestId(`match-condition-${conditionA.id}`)
      ).getByLabelText(/Add Condition/i);
      userEvent.click(removeBtn);

      expect(onGroupChangeSpy).to.have.been.calledWith({
        ...group,
        conditions: [
          conditionA,
          { id: 3, field: '', operator: '$eq', value: '', bsonType: '' },
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
      expect(screen.getByTestId(`match-condition-${conditionA.id}`)).to.exist;
      expect(screen.getByTestId(`match-condition-${conditionB.id}`)).to.exist;

      const removeBtn = within(
        screen.getByTestId(`match-condition-${conditionA.id}`)
      ).getByLabelText(/Remove Condition/i);
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
        new RegExp(FIELD_SELECT_LABEL, 'i'),
        '_id',
        within(
          screen.getByTestId(`match-condition-${conditionA.id}`)
        ).getByTestId(`match-condition-${conditionA.id}-field-combobox`)
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

    it('should call onGroupChange with modified set of nested groups when a nested group is modified', function () {
      const onGroupChangeSpy = Sinon.spy();
      const nestedGroup = createGroup();
      const group = createGroup({
        groups: [nestedGroup],
      });
      renderGroup({ group, onGroupChange: onGroupChangeSpy });
      const addGroupBtn = within(
        screen.getByTestId(`match-group-${nestedGroup.id}-header`)
      ).getByLabelText(/Add Group/i);
      userEvent.click(addGroupBtn);

      expect(onGroupChangeSpy.lastCall.args[0].groups).to.have.lengthOf(2);
    });

    describe('#component - GroupHeader', function () {
      it('should render a disabled add button when there are two groups at a nesting level', function () {
        const subGroupA = createGroup({ logicalOperator: '$and' });
        const subGroupB = createGroup({ logicalOperator: '$or' });
        const rootGroup = createGroup({ groups: [subGroupA, subGroupB] });
        renderGroup({ group: rootGroup });

        const addBtnA = within(
          screen.getByTestId(`match-group-${subGroupA.id}-header`)
        ).getByLabelText(/Add Group/i);

        expect(addBtnA.getAttribute('aria-disabled')).to.equal('true');

        const addBtnB = within(
          screen.getByTestId(`match-group-${subGroupB.id}-header`)
        ).getByLabelText(/Add Group/i);

        expect(addBtnB.getAttribute('aria-disabled')).to.equal('true');
      });

      it('should render a disabled remove button when disableRemoveGroup is true', function () {
        const group = renderGroup({ disableRemoveGroup: true });
        const removeBtn = within(
          screen.getByTestId(`match-group-${group.id}-header`)
        ).getByLabelText(/Remove Group/i);

        expect(removeBtn.getAttribute('aria-disabled')).to.equal('true');
      });

      it('should call onGroupChange when an operator is selected', function () {
        const onGroupChangeSpy = Sinon.spy();
        const group = renderGroup({ onGroupChange: onGroupChangeSpy });
        const operatorControl = within(
          screen.getByTestId(`match-group-${group.id}-header`)
        ).getByRole('tablist');

        userEvent.click(within(operatorControl).getByText(/Or/i));

        expect(onGroupChangeSpy).to.have.been.calledWithExactly({
          ...group,
          logicalOperator: '$or',
        });
      });

      it('should call onAddGroupClick when Add group button is clicked', function () {
        const onAddGroupClickSpy = Sinon.spy();
        const group = renderGroup({
          disableAddGroup: false,
          onAddGroupClick: onAddGroupClickSpy,
        });
        const addBtn = within(
          screen.getByTestId(`match-group-${group.id}-header`)
        ).getByLabelText(/Add Group/i);

        userEvent.click(addBtn);

        expect(onAddGroupClickSpy).to.have.been.called;
      });

      it('should call onRemoveGroupClick when Remove group button is clicked', function () {
        const onRemoveGroupClickSpy = Sinon.spy();
        const group = renderGroup({
          disableRemoveGroup: false,
          onRemoveGroupClick: onRemoveGroupClickSpy,
        });
        const addBtn = within(
          screen.getByTestId(`match-group-${group.id}-header`)
        ).getByLabelText(/Remove Group/i);

        userEvent.click(addBtn);

        expect(onRemoveGroupClickSpy).to.have.been.called;
      });
    });

    describe('#component - GroupFooter', function () {
      it('should not render footer controls when there are subgroups of rendered group', function () {
        const subGroup = createGroup();
        const group = createGroup({
          groups: [subGroup],
        });
        renderGroup({ group });
        // The root group has a subgroup hence no footer control for this component
        expect(screen.queryByTestId(`match-group-${group.id}-footer`)).to.be
          .null;
      });

      it('should not render footer controls when the nesting level is >= maximum allowed nesting', function () {
        const group = renderGroup({ nestingLevel: 3 });
        expect(screen.queryByTestId(`match-group-${group.id}-footer`)).to.be
          .null;
      });

      it('should render footer controls when there are no subgroups at any level', function () {
        const group = renderGroup();
        // The root group has no subgroup hence a footer control for this component
        expect(screen.queryByTestId(`match-group-${group.id}-footer`)).to.not.be
          .null;
      });
    });
  });
});
