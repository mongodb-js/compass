import React from 'react';
import type { CSSProperties } from 'react';
import {
  css,
  spacing,
  SegmentedControl,
  SegmentedControlOption,
  ListEditor,
  Button,
  Icon,
  IconButton,
  palette,
  cx,
  Tooltip,
} from '@mongodb-js/compass-components';
import MatchConditionForm, { createCondition } from './match-condition-form';
import type { CreateConditionFn } from './match-condition-form';
import type { WizardComponentProps } from '..';
import type { LogicalOperator, MatchCondition, MatchGroup } from './match';

// Types
export type MatchGroupFormProps = {
  /**
   * List of fields that will be passed down to ConditionForm to render Field combobox
   */
  fields: WizardComponentProps['fields'];

  /**
   * An object of type MatchGroup that needs to be rendered
   */
  group: MatchGroup;

  /**
   * The level at which this group is nested
   */
  nestingLevel: number;

  /**
   * The maximum available nesting depth, this is supposed to be calculated by
   * the component rendering the group at level 0 and then simply passed down
   */
  nestingDepth: number;

  /**
   * Method to call when the group is changed
   */
  onGroupChange: (changedGroup: MatchGroup) => void;

  /**
   * Method to call when the group is removed. Optional because the root group
   * cannot be removed
   */
  onGroupRemoved?: () => void;
};

export type CreateGroupFn = (group?: Partial<MatchGroup>) => MatchGroup;

// Helpers
export const LABELS = {
  operatorSelect: 'Select a group operator',
};

export const TEST_IDS = {
  container: (id: number) => `match-group-${id}`,
  operatorSelect: (id: number) => `match-group-${id}-operator-select`,
  addNestedGroupBtn: (id: number) => `match-group-${id}-add-nested-group-btn`,
  removeGroupBtn: (id: number) => `match-group-${id}-remove-group-btn`,
  addConditionBtn: () => 'add-condition-button',
  removeConditionBtn: () => 'remove-condition-button',
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
    nestedGroups: [],
    ...group,
  });
};

export const createGroup = makeCreateGroup(createCondition);

// Components - Group
const baseGroupStyles = css({
  display: 'flex',
  gap: spacing[3],
  flexDirection: 'column',
});

const nestedGroupStyles = css({
  padding: spacing[4],
  paddingTop: spacing[4] / 2,
  borderRadius: spacing[4] / 2,
});

const level1GroupStyles = css({
  background: palette.gray.light3,
});

const level2GroupStyles = css({
  background: palette.gray.light2,
});

const groupHeaderStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[3],
});

const MatchGroupForm = ({
  fields,
  group,
  nestingLevel,
  nestingDepth,
  onGroupChange,
  onGroupRemoved,
}: MatchGroupFormProps) => {
  const disableAddNestedGroupBtn = nestingLevel === 2;
  const showRemoveGroup = nestingLevel > 0;

  // To align the "action buttons on condition list" with the "action buttons on
  // condition list in nested groups", we calculate the right padding
  // dynamically using the nesting depth and current nesting level.
  const conditionListStyles: CSSProperties = {
    paddingRight: (nestingDepth - nestingLevel) * spacing[4],
  };

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
    const newNestedGroups = [...group.nestedGroups, createGroup()];
    onGroupChange({
      ...group,
      nestedGroups: newNestedGroups,
    });
  };

  const handleRemoveNestedGroupClick = (nestedGroupIdx: number) => {
    const remainingNestedGroups = [...group.nestedGroups];
    remainingNestedGroups.splice(nestedGroupIdx, 1);
    onGroupChange({
      ...group,
      nestedGroups: remainingNestedGroups,
    });
  };

  const handleNestedGroupChange = (
    nestedGroupIdx: number,
    changedNestedGroup: MatchGroup
  ) => {
    const changedNestedGroups = [...group.nestedGroups];
    changedNestedGroups[nestedGroupIdx] = changedNestedGroup;
    onGroupChange({
      ...group,
      nestedGroups: changedNestedGroups,
    });
  };

  return (
    <div
      data-testid={TEST_IDS.container(group.id)}
      className={cx(baseGroupStyles, {
        [nestedGroupStyles]: nestingLevel !== 0,
        [level1GroupStyles]: nestingLevel === 1,
        [level2GroupStyles]: nestingLevel === 2,
      })}
    >
      {/* Group header */}
      <div className={groupHeaderStyles}>
        <SegmentedControl
          size="small"
          value={group.logicalOperator}
          data-testid={TEST_IDS.operatorSelect(group.id)}
          onChange={(operator) => {
            handleOperatorChange(operator as LogicalOperator);
          }}
        >
          <SegmentedControlOption value="$and">AND</SegmentedControlOption>
          <SegmentedControlOption value="$or">OR</SegmentedControlOption>
        </SegmentedControl>
        <Tooltip
          align="top"
          justify="middle"
          enabled={disableAddNestedGroupBtn}
          trigger={({ children, ...props }) => (
            <div {...props} style={{ display: 'inherit' }}>
              <Button
                size="xsmall"
                disabled={disableAddNestedGroupBtn}
                aria-label="Add nested group"
                leftGlyph={<Icon glyph="Plus" />}
                data-testid={TEST_IDS.addNestedGroupBtn(group.id)}
                onClick={handleAddNestedGroupClick}
              >
                {children}
                Nested Group
              </Button>
            </div>
          )}
        >
          Adding more than two nested groups is not supported at the moment.
        </Tooltip>
        {showRemoveGroup && (
          <IconButton
            aria-label="Remove group"
            onClick={onGroupRemoved}
            data-testid={TEST_IDS.removeGroupBtn(group.id)}
          >
            <Icon glyph="Trash" />
          </IconButton>
        )}
      </div>

      {/* Conditions */}
      <div style={conditionListStyles}>
        <ListEditor
          items={group.conditions}
          itemKey={(condition) => `group-${group.id}-condition-${condition.id}`}
          renderItem={(condition: MatchCondition, conditionIdx: number) => (
            <MatchConditionForm
              fields={fields}
              condition={condition}
              onConditionChange={(changedCondition) =>
                handleConditionChange(conditionIdx, changedCondition)
              }
            />
          )}
          disableAddButton={() => false}
          onAddItem={handleAddConditionClick}
          addButtonTestId={TEST_IDS.addConditionBtn()}
          disableRemoveButton={() => group.conditions.length === 1}
          onRemoveItem={handleRemoveConditionClick}
          removeButtonTestId={TEST_IDS.removeConditionBtn()}
        />
      </div>

      {/* Nested groups */}
      <ListEditor
        items={group.nestedGroups}
        itemKey={(nestedGroup) =>
          `group-${group.id}-nested-group-${nestedGroup.id}`
        }
        renderItem={(nestedGroup: MatchGroup, nestedGroupIdx: number) => (
          <MatchGroupForm
            fields={fields}
            group={nestedGroup}
            nestingLevel={nestingLevel + 1}
            nestingDepth={nestingDepth}
            onGroupChange={(changedNestedGroup) =>
              handleNestedGroupChange(nestedGroupIdx, changedNestedGroup)
            }
            onGroupRemoved={() => handleRemoveNestedGroupClick(nestedGroupIdx)}
          />
        )}
        disableAddButton={() => true}
        onAddItem={() => {
          // no-op
        }}
        disableRemoveButton={() => true}
        onRemoveItem={() => {
          // no-op
        }}
      />
    </div>
  );
};

export default MatchGroupForm;
