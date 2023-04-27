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
  MatchConditionGroups,
} from './match';

// Types
export type GroupHeaderProps = {
  dataTestId: string;
  /**
   * Disables the Add icon button rendered in the header. We disable the Add
   * icon button when the header is rendered for a group at nestingLevel === 0
   * or there are already some groups present at that particular level.
   */
  disableAddGroup: boolean;
  /**
   * Disables the Remove icon button. We disable the Remove icon button when the
   * header is rendered for a group at nestingLevel === 0 and there is only one
   * group present at that particular level.
   */
  disableRemoveGroup: boolean;
  operator: LogicalOperator;
  onOperatorChange: (operator: LogicalOperator) => void;
  onAddGroupClick: () => void;
  onRemoveGroupClick: () => void;
};

export type GroupFooterProps = {
  dataTestId: string;
  onAddNestedGroupClick: () => void;
};

export type GroupProps = {
  fields: WizardComponentProps['fields'];
  nestingLevel: number;
  // See: GroupHeaderProps['disableAddGroup']
  disableAddGroup: boolean;
  // See: GroupHeaderProps['disableRemoveGroup']
  disableRemoveGroup: boolean;
  group: MatchConditionGroup;
  onGroupChange: (changedGroup: MatchConditionGroup) => void;
  onRemoveGroupClick: () => void;
  onAddGroupClick: () => void;
};

export type CreateGroupFn = (
  group?: Partial<MatchConditionGroup>
) => MatchConditionGroup;

// Helpers
const MAX_ALLOWED_NESTING = 3;

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

export const makeGroupsHandlers = (
  groups: MatchConditionGroups,
  onGroupsChange: (newGroups: MatchConditionGroups) => void
) => ({
  handleGroupChange(groupIdx: number, newGroup: MatchConditionGroup) {
    if (!groups[groupIdx]) {
      return;
    }

    const newGroups = [...groups];
    newGroups[groupIdx] = newGroup;
    // Update the other group's logicalOperator
    // if the current group operator is updated
    const otherGroupIdx = groupIdx === 0 ? 1 : 0;
    const otherGroup = newGroups[otherGroupIdx];
    if (otherGroup && otherGroup.logicalOperator === newGroup.logicalOperator) {
      otherGroup.logicalOperator =
        newGroup.logicalOperator === '$and' ? '$or' : '$and';
    }

    onGroupsChange(newGroups);
  },

  handleRemoveGroupClick(groupIdx: number) {
    if (!groups[groupIdx]) {
      return;
    }

    const remainingGroups = [...groups];
    remainingGroups.splice(groupIdx, 1);
    onGroupsChange(remainingGroups);
  },

  handleAddGroupClick() {
    if (groups.length > 1) {
      // There can only be two groups ($and and $or)
      // at any nesting level.
      return;
    }

    const existingGroup = groups[0];
    const alreadySelectedOperator = existingGroup?.logicalOperator;
    const newGroupOperator =
      alreadySelectedOperator === '$and' ? '$or' : '$and';
    onGroupsChange([
      ...groups,
      createGroup({ logicalOperator: newGroupOperator }),
    ]);
  },
});

// Components - GroupHeader
const groupHeaderStyles = css({
  display: 'flex',
  justifyContent: 'flex-start',
  gap: spacing[3],
  width: `calc(100% - ${CONDITION_CONTROLS_WIDTH})`,
});

export const GroupHeader = ({
  dataTestId,
  disableAddGroup,
  disableRemoveGroup,
  operator,
  onOperatorChange,
  onAddGroupClick,
  onRemoveGroupClick,
}: GroupHeaderProps) => {
  return (
    <div data-testid={dataTestId} className={groupHeaderStyles}>
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
      <div>
        <IconButton
          disabled={disableAddGroup}
          aria-label="Add Group"
          onClick={onAddGroupClick}
        >
          <Icon glyph="Plus" />
        </IconButton>
        <IconButton
          disabled={disableRemoveGroup}
          aria-label="Remove Group"
          onClick={onRemoveGroupClick}
        >
          <Icon glyph="Trash" />
        </IconButton>
      </div>
    </div>
  );
};

// Components - GroupFooter
const groupFooterStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  // This is done to align the footer's end with the end of last field in the
  // condition right above it spacing[2] is the padding provided to conditions
  // container
  width: `calc(100% - ${CONDITION_CONTROLS_WIDTH + spacing[2]}px)`,
});

const GroupFooter = ({
  dataTestId,
  onAddNestedGroupClick,
}: GroupFooterProps) => {
  return (
    <div data-testid={dataTestId} className={groupFooterStyles}>
      <Button
        variant="default"
        size="xsmall"
        type="button"
        onClick={onAddNestedGroupClick}
      >
        ADD GROUP
      </Button>
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

const nestedGroupsContainerStyles = (groupsLength: number) =>
  css({
    display: groupsLength === 0 ? 'none' : 'block',
  });

const nestedGroupStyles = (nestingLevel: number) => {
  if (nestingLevel === 0) {
    return undefined;
  } else if (nestingLevel === 1) {
    return css({
      border: `1px solid ${palette.gray.light2}`,
      borderRadius: spacing[2],
      padding: `${spacing[3]}px 0 ${spacing[3]}px ${spacing[4]}px`,
    });
  } else {
    return css({
      border: `1px solid ${palette.gray.light2}`,
      borderRight: 0,
      borderRadius: spacing[2],
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      padding: `${spacing[3]}px 0 ${spacing[3]}px ${spacing[4]}px`,
    });
  }
};

const Group = ({
  fields,
  nestingLevel,
  disableAddGroup,
  disableRemoveGroup,
  group,
  onGroupChange,
  onRemoveGroupClick,
  onAddGroupClick,
}: GroupProps) => {
  const showFooterControls =
    nestingLevel < MAX_ALLOWED_NESTING && group.groups.length === 0;

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
      // We don't remove the last condition
      // as there is no other way to add one.
      // If user would like all conditions removed
      // then they probably should remove the group
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

  const nestedGroupHandlers = makeGroupsHandlers(
    group.groups,
    (newNestedGroups) => {
      onGroupChange({ ...group, groups: newNestedGroups });
    }
  );

  return (
    <div
      data-testid={`match-group-${group.id}`}
      className={cx(groupStyles, nestedGroupStyles(nestingLevel))}
    >
      <GroupHeader
        dataTestId={`match-group-${group.id}-header`}
        disableAddGroup={disableAddGroup}
        disableRemoveGroup={disableRemoveGroup}
        operator={group.logicalOperator}
        onOperatorChange={handleOperatorChange}
        onRemoveGroupClick={onRemoveGroupClick}
        onAddGroupClick={onAddGroupClick}
      />
      <div
        data-testid={`match-group-${group.id}-conditions`}
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
        data-testid={`match-group-${group.id}-nested-groups`}
        className={nestedGroupsContainerStyles(group.groups.length)}
      >
        {group.groups.map((nestedGroup, groupIdx) => (
          <Group
            key={nestedGroup.id}
            fields={fields}
            nestingLevel={nestingLevel + 1}
            disableAddGroup={group.groups.length === 2}
            disableRemoveGroup={false}
            group={nestedGroup}
            onGroupChange={(changedGroup) => {
              nestedGroupHandlers.handleGroupChange(groupIdx, changedGroup);
            }}
            onRemoveGroupClick={() =>
              nestedGroupHandlers.handleRemoveGroupClick(groupIdx)
            }
            onAddGroupClick={() => nestedGroupHandlers.handleAddGroupClick()}
          />
        ))}
      </div>
      {showFooterControls && (
        <GroupFooter
          dataTestId={`match-group-${group.id}-footer`}
          onAddNestedGroupClick={() =>
            nestedGroupHandlers.handleAddGroupClick()
          }
        />
      )}
    </div>
  );
};

export default Group;
