import React from 'react';
import {
  css,
  spacing,
  SegmentedControl,
  SegmentedControlOption,
  ListEditor,
} from '@mongodb-js/compass-components';
import MatchConditionForm, { createCondition } from './match-condition-form';
import type { CreateConditionFn } from './match-condition-form';
import type { WizardComponentProps } from '..';
import type { LogicalOperator, MatchCondition, MatchGroup } from './match';

// Types
export type MatchGroupFormProps = {
  fields: WizardComponentProps['fields'];
  group: MatchGroup;
  onGroupChange: (changedGroup: MatchGroup) => void;
};

export type CreateGroupFn = (group?: Partial<MatchGroup>) => MatchGroup;

// Helpers
export const LABELS = {
  operatorSelect: 'Select a group operator',
};

export const TEST_IDS = {
  container: (id: number) => `match-group-${id}`,
  operatorSelect: (id: number) => `match-group-${id}-operator-select`,
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
    ...group,
  });
};

export const createGroup = makeCreateGroup(createCondition);

// Components - Group
const groupStyles = css({
  display: 'flex',
  gap: spacing[3],
  flexDirection: 'column',
});

const MatchGroupForm = ({
  fields,
  group,
  onGroupChange,
}: MatchGroupFormProps) => {
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
      <ListEditor
        items={group.conditions}
        itemKey={(item) => String(item.id)}
        renderItem={(condition: MatchCondition, conditionIdx: number) => (
          <MatchConditionForm
            fields={fields}
            condition={condition}
            onConditionChange={(newCondition) =>
              handleConditionChange(conditionIdx, newCondition)
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
  );
};

export default MatchGroupForm;
