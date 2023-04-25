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
import Conditions from './conditions';
import { CONDITION_CONTROLS_WIDTH } from './condition';
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
  disableAddGroup: boolean;
  disableRemoveGroup: boolean;
  group: MatchConditionGroup;
  onGroupChange: (changedGroup: MatchConditionGroup) => void;
  onRemoveGroupClick: () => void;
  onAddGroupClick: () => void;
};

type GroupHeaderProps = {
  operator: LogicalOperator;
  disableAddBtn: boolean;
  disableRemoveBtn: boolean;
  onOperatorChange: (operator: LogicalOperator) => void;
  onAddGroupClick: () => void;
  onRemoveGroupClick: () => void;
};

type GroupFooterProps = {
  disableAddNestedGroup: boolean;
  onAddNestedGroupClick: () => void;
};

// Components - GroupHeader
const groupHeaderStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  width: `calc(100% - ${CONDITION_CONTROLS_WIDTH})`,
});

const GroupHeader = ({
  disableAddBtn,
  disableRemoveBtn,
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
        <IconButton
          disabled={disableAddBtn}
          aria-label="Add Group"
          onClick={onAddGroupClick}
        >
          <Icon glyph="Plus" />
        </IconButton>
        <IconButton
          disabled={disableRemoveBtn}
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

const GroupFooter = ({
  disableAddNestedGroup,
  onAddNestedGroupClick,
}: GroupFooterProps) => {
  return (
    <div data-testid="match-group-footer" className={groupFooterStyles}>
      <Button
        as="button"
        size="small"
        type="button"
        disabled={disableAddNestedGroup}
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

const nestedGroupStyles = css({
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: '12px',
  padding: '15px 30px 15px 30px',
});

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
  const disableAddNestedGroup = nestingLevel === 3;

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

  const handleConditionsChange = (newConditions: MatchCondition[]) =>
    onGroupChange({
      ...group,
      conditions: newConditions,
    });

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
        disableAddBtn={disableAddGroup}
        disableRemoveBtn={disableRemoveGroup}
        operator={group.logicalOperator}
        onOperatorChange={handleOperatorChange}
        onAddGroupClick={onAddGroupClick}
        onRemoveGroupClick={onRemoveGroupClick}
      />
      <Conditions
        fields={fields}
        conditions={group.conditions}
        onConditionsChange={handleConditionsChange}
      />
      <GroupFooter
        disableAddNestedGroup={disableAddNestedGroup}
        onAddNestedGroupClick={handleAddNestedGroupClick}
      />
      <Groups
        nestingLevel={nestingLevel + 1}
        fields={fields}
        groups={group.groups}
        onGroupsChange={handleNestedGroupsChange}
      />
    </div>
  );
};

export default Group;
