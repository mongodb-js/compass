import React from 'react';
import {
  css,
  spacing,
  cx,
  SegmentedControl,
  SegmentedControlOption,
} from '@mongodb-js/compass-components';
import Condition, {
  CONDITION_CONTROLS_WIDTH,
  createCondition,
} from './condition';
import type { CreateConditionFn } from './condition';
import type { WizardComponentProps } from '..';
import type { LogicalOperator, MatchCondition, MatchGroup } from './match';

// Types
export type GroupHeaderProps = {
  groupId: number;
  operator: LogicalOperator;
  onOperatorChange: (operator: LogicalOperator) => void;
};

export type GroupProps = {
  fields: WizardComponentProps['fields'];
  group: MatchGroup;
  onGroupChange: (changedGroup: MatchGroup) => void;
};

export type CreateGroupFn = (group?: Partial<MatchGroup>) => MatchGroup;

// Helpers
export const LABELS = {
  addNestedGroupBtn: 'Add nested group',
  removeGroupBtn: 'Remove group',
};

export const TEST_IDS = {
  container: (id: number) => `match-group-${id}`,
  header: (id: number) => `match-group-${id}-header`,
  addNestedGroupBtn: (id: number) => `match-group-${id}-add-nested-group-btn`,
  removeGroupBtn: (id: number) => `match-group-${id}-remove-group-btn`,
  conditionsContainer: (id: number) => `match-group-${id}-conditions`,
  nestedGroupsContainer: (id: number) => `match-group-${id}-nested-groups`,
};

/**
 * Returns a function to create a group with incremental ids. Consider using
 * already created `createGroup` below instead of making another one yourself.
 * This function is exported primarily to aid in testing.
 */
export const makeCreateGroup = (
  createCondition: CreateConditionFn
): CreateGroupFn => {
  let id = 1;
  return (group: Omit<Partial<MatchGroup>, 'id'> = {}): MatchGroup => ({
    id: id++,
    logicalOperator: '$and',
    conditions: [createCondition()],
    ...group,
  });
};

export const createGroup = makeCreateGroup(createCondition);

// Components - Group
const groupHeaderStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  width: `calc(100% - ${CONDITION_CONTROLS_WIDTH}px)`,
});

const groupStyles = css({
  display: 'flex',
  gap: spacing[3],
  flexDirection: 'column',
});

const conditionContainerStyles = cx(
  groupStyles,
  css({
    paddingRight: spacing[2],
  })
);

const Group = ({ fields, group, onGroupChange }: GroupProps) => {
  const handleOperatorChange = (operator: LogicalOperator) => {
    onGroupChange({
      ...group,
      logicalOperator: operator,
    });
  };

  const handleAddConditionClick = (afterIdx: number) => {
    const newConditions = [...group.conditions];
    newConditions.splice(afterIdx + 1, 0, createCondition());
    onGroupChange({
      ...group,
      conditions: newConditions,
    });
  };

  const handleRemoveConditionClick = (atIdx: number) => {
    if (group.conditions.length === 1) {
      // We don't remove the last condition as there is no other way to add one.
      // If user would like all conditions removed then they probably should
      // remove the group
      return;
    }

    const remainingConditions = [...group.conditions];
    remainingConditions.splice(atIdx, 1);
    onGroupChange({
      ...group,
      conditions: remainingConditions,
    });
  };

  const handleConditionChange = (
    conditionIdx: number,
    newCondition: MatchCondition
  ) => {
    const newConditions = [...group.conditions];
    newConditions[conditionIdx] = newCondition;
    onGroupChange({
      ...group,
      conditions: newConditions,
    });
  };

  return (
    <div data-testid={TEST_IDS.container(group.id)} className={groupStyles}>
      <div
        data-testid={TEST_IDS.header(group.id)}
        className={groupHeaderStyles}
      >
        <SegmentedControl
          size="small"
          value={group.logicalOperator}
          onChange={(operator) => {
            handleOperatorChange(operator as LogicalOperator);
          }}
        >
          <SegmentedControlOption value="$and">AND</SegmentedControlOption>
          <SegmentedControlOption value="$or">OR</SegmentedControlOption>
        </SegmentedControl>
      </div>
      <div
        data-testid={TEST_IDS.conditionsContainer(group.id)}
        className={conditionContainerStyles}
      >
        {group.conditions.map((condition, conditionIdx) => (
          <Condition
            key={condition.id}
            disableRemoveBtn={group.conditions.length === 1}
            fields={fields}
            condition={condition}
            onConditionChange={(newCondition) =>
              handleConditionChange(conditionIdx, newCondition)
            }
            onAddConditionClick={() => handleAddConditionClick(conditionIdx)}
            onRemoveConditionClick={() =>
              handleRemoveConditionClick(conditionIdx)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default Group;
