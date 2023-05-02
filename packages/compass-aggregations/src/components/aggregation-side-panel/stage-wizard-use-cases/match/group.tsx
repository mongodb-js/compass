import React from 'react';
import {
  css,
  spacing,
  palette,
  cx,
  Icon,
  IconButton,
  SegmentedControl,
  SegmentedControlOption,
  Button,
} from '@mongodb-js/compass-components';
import Condition, {
  CONDITION_CONTROLS_WIDTH,
  createCondition,
} from './condition';
import type { CreateConditionFn } from './condition';
import type { WizardComponentProps } from '..';
import type {
  LogicalOperator,
  MatchCondition,
  MatchConditionGroup,
} from './match';

// Types
export type GroupHeaderProps = {
  groupId: number;
  operator: LogicalOperator;
  onOperatorChange: (operator: LogicalOperator) => void;
  disableAddNestedGroup: boolean;
  onAddNestedGroupClick: () => void;
  disableRemoveGroup: boolean;
  onRemoveGroupClick?: () => void;
};

export type GroupProps = {
  fields: WizardComponentProps['fields'];
  nestingLevel: number;
  group: MatchConditionGroup;
  onGroupChange: (changedGroup: MatchConditionGroup) => void;
  onRemoveGroupClick?: () => void;
};

export type CreateGroupFn = (
  group?: Partial<MatchConditionGroup>
) => MatchConditionGroup;

// Helpers
const MAX_ALLOWED_NESTING = 3;
const MAX_ALLOWED_SUB_GROUPS = 6;
export const ADD_NESTED_GROUP_BTN_LABEL = 'Add nested group';
export const REMOVE_GROUP_BTN_LABEL = 'Remove group';

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
  return (
    group: Omit<Partial<MatchConditionGroup>, 'id'> = {}
  ): MatchConditionGroup => ({
    id: id++,
    logicalOperator: '$and',
    conditions: [createCondition()],
    groups: [],
    ...group,
  });
};

export const createGroup = makeCreateGroup(createCondition);

// Components - GroupHeader
const groupHeaderStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  width: `calc(100% - ${CONDITION_CONTROLS_WIDTH}px)`,
});

const groupControlsStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

export const GroupHeader = ({
  groupId,
  operator,
  onOperatorChange,
  disableAddNestedGroup,
  onAddNestedGroupClick,
  disableRemoveGroup,
  onRemoveGroupClick,
}: GroupHeaderProps) => {
  return (
    <div data-testid={TEST_IDS.header(groupId)} className={groupHeaderStyles}>
      <SegmentedControl
        size="small"
        value={operator}
        onChange={(operator) => {
          onOperatorChange(operator as LogicalOperator);
        }}
      >
        <SegmentedControlOption value="$and">AND</SegmentedControlOption>
        <SegmentedControlOption value="$or">OR</SegmentedControlOption>
      </SegmentedControl>
      <div className={groupControlsStyles}>
        {/* TODO: Remove the inline styles once design for nested group is finalized (COMPASS-6678) */}
        <Button
          style={{ display: 'none' }}
          disabled={disableAddNestedGroup}
          variant="default"
          size="xsmall"
          type="button"
          aria-label={LABELS.addNestedGroupBtn}
          data-testid={TEST_IDS.addNestedGroupBtn(groupId)}
          onClick={onAddNestedGroupClick}
        >
          ADD GROUP
        </Button>
        <IconButton
          style={{ display: 'none' }}
          disabled={disableRemoveGroup}
          aria-label={LABELS.removeGroupBtn}
          data-testid={TEST_IDS.removeGroupBtn(groupId)}
          onClick={onRemoveGroupClick}
        >
          <Icon glyph="Trash" />
        </IconButton>
      </div>
    </div>
  );
};

// Components - Group
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

const nestedGroupsContainerStyles = css({
  gap: spacing[3],
  display: 'flex',
  flexDirection: 'column',
});

const nestedGroupLevel1Styles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: spacing[2],
  padding: `${spacing[3]}px 0 ${spacing[3]}px ${spacing[4]}px`,
});

const nestedGroupLevelXStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRight: 0,
  borderRadius: spacing[2],
  borderTopRightRadius: 0,
  borderBottomRightRadius: 0,
  padding: `${spacing[3]}px 0 ${spacing[3]}px ${spacing[4]}px`,
});

const Group = ({
  fields,
  nestingLevel,
  group,
  onGroupChange,
  onRemoveGroupClick,
}: GroupProps) => {
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

  const handleAddNestedGroupClick = () => {
    const newNestedGroups = [...group.groups, createGroup()];
    onGroupChange({
      ...group,
      groups: newNestedGroups,
    });
  };

  const handleNestedGroupChange = (
    nestedGroupIdx: number,
    newGroup: MatchConditionGroup
  ) => {
    if (!group.groups[nestedGroupIdx]) {
      return;
    }

    const newNestedGroups = [...group.groups];
    newNestedGroups[nestedGroupIdx] = newGroup;
    onGroupChange({
      ...group,
      groups: newNestedGroups,
    });
  };

  const handleNestedGroupRemoveClick = (nestedGroupIdx: number) => {
    if (!group.groups[nestedGroupIdx]) {
      return;
    }

    const remainingNestedGroups = [...group.groups];
    remainingNestedGroups.splice(nestedGroupIdx, 1);
    onGroupChange({
      ...group,
      groups: remainingNestedGroups,
    });
  };

  return (
    <div
      data-testid={TEST_IDS.container(group.id)}
      className={cx(groupStyles, {
        [nestedGroupLevel1Styles]: nestingLevel === 1,
        [nestedGroupLevelXStyles]: nestingLevel > 1,
      })}
    >
      <GroupHeader
        groupId={group.id}
        operator={group.logicalOperator}
        onOperatorChange={handleOperatorChange}
        disableAddNestedGroup={
          group.groups.length === MAX_ALLOWED_SUB_GROUPS ||
          nestingLevel === MAX_ALLOWED_NESTING
        }
        onAddNestedGroupClick={handleAddNestedGroupClick}
        disableRemoveGroup={nestingLevel === 0}
        onRemoveGroupClick={onRemoveGroupClick}
      />
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
      <div
        data-testid={TEST_IDS.nestedGroupsContainer(group.id)}
        className={nestedGroupsContainerStyles}
      >
        {group.groups.map((nestedGroup, groupIdx) => (
          <Group
            key={nestedGroup.id}
            fields={fields}
            nestingLevel={nestingLevel + 1}
            group={nestedGroup}
            onGroupChange={(newGroup) =>
              handleNestedGroupChange(groupIdx, newGroup)
            }
            onRemoveGroupClick={() => handleNestedGroupRemoveClick(groupIdx)}
          />
        ))}
      </div>
    </div>
  );
};

export default Group;
