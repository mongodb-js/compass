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
import Groups, { makeAddGroupHandler } from './groups';
import Condition, {
  CONDITION_CONTROLS_WIDTH,
  createCondition,
} from './condition';
import type { WizardComponentProps } from '..';
import type {
  LogicalOperator,
  MatchCondition,
  MatchConditionGroup,
  MatchConditionGroups,
} from './match';

// Types
type GroupProps = {
  fields: WizardComponentProps['fields'];
  nestingLevel: number;
  // See: GroupHeaderProps['hideAddGroup']
  hideAddGroup: boolean;
  // See: GroupHeaderProps['disableRemoveGroup']
  disableRemoveGroup: boolean;
  group: MatchConditionGroup;
  onGroupChange: (changedGroup: MatchConditionGroup) => void;
  onRemoveGroupClick: () => void;
  onAddGroupClick: () => void;
};

type GroupHeaderProps = {
  /**
   * Hides the Add icon button rendered in the header. We hide the Add icon
   * button when the header is rendered for a group at nestingLevel === 0 or
   * there are already two groups present at that particular level.
   */
  hideAddGroup: boolean;
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

type GroupFooterProps = {
  onAddNestedGroupClick: () => void;
};

// Helpers
const MAX_ALLOWED_NESTING = 3;

// Components - GroupHeader
const groupHeaderStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  width: `calc(100% - ${CONDITION_CONTROLS_WIDTH})`,
});

const GroupHeader = ({
  hideAddGroup,
  disableRemoveGroup,
  operator,
  onOperatorChange,
  onAddGroupClick,
  onRemoveGroupClick,
}: GroupHeaderProps) => {
  return (
    <div data-testid="match-group-header" className={groupHeaderStyles}>
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
        {!hideAddGroup && (
          <IconButton aria-label="Add Group" onClick={onAddGroupClick}>
            <Icon glyph="Plus" />
          </IconButton>
        )}
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
  width: `calc(100% - ${CONDITION_CONTROLS_WIDTH})`,
});

const GroupFooter = ({ onAddNestedGroupClick }: GroupFooterProps) => {
  return (
    <div data-testid="match-group-footer" className={groupFooterStyles}>
      <Button as="a" size="small" type="button" onClick={onAddNestedGroupClick}>
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

const nestedGroupStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '12px',
  padding: '15px 30px 15px 30px',
});

const Group = ({
  fields,
  nestingLevel,
  hideAddGroup,
  disableRemoveGroup,
  group,
  onGroupChange,
  onRemoveGroupClick,
  onAddGroupClick,
}: GroupProps) => {
  const hideAddNestedGroup =
    group.groups.length === 2 || nestingLevel === MAX_ALLOWED_NESTING;

  const handleOperatorChange = (operator: LogicalOperator) => {
    onGroupChange({
      ...group,
      logicalOperator: operator,
    });
  };

  const handleAddNestedGroupClick = makeAddGroupHandler(
    group.groups,
    (newGroups) => {
      onGroupChange({
        ...group,
        groups: newGroups,
      });
    }
  );

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

  const handleNestedGroupsChange = (newGroups: MatchConditionGroups) =>
    onGroupChange({
      ...group,
      groups: newGroups,
    });

  return (
    <div
      data-testid={`match-group-${group.id}`}
      className={cx(groupStyles, nestingLevel !== 0 && nestedGroupStyles)}
    >
      <GroupHeader
        hideAddGroup={hideAddGroup}
        disableRemoveGroup={disableRemoveGroup}
        operator={group.logicalOperator}
        onOperatorChange={handleOperatorChange}
        onAddGroupClick={onAddGroupClick}
        onRemoveGroupClick={onRemoveGroupClick}
      />
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
      <Groups
        nestingLevel={nestingLevel + 1}
        fields={fields}
        groups={group.groups}
        onGroupsChange={handleNestedGroupsChange}
      />
      {!hideAddNestedGroup && (
        <GroupFooter onAddNestedGroupClick={handleAddNestedGroupClick} />
      )}
    </div>
  );
};

export default Group;
