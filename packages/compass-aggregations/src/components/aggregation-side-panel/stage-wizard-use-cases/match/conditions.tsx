import React from 'react';
import Condition from './condition';
import type { MatchCondition } from './match';
import type { WizardComponentProps } from '..';

// Types
type ConditionsProps = {
  fields: WizardComponentProps['fields'];
  conditions: MatchCondition[];
  onConditionsChange: (newConditions: MatchCondition[]) => void;
};

// Helpers
export const createCondition = (() => {
  let id = 1;
  return (
    condition: Omit<Partial<MatchCondition>, 'id'> = {}
  ): MatchCondition => ({
    id: id++,
    field: '',
    operator: '$eq',
    value: '',
    bsonType: '',
    ...condition,
  });
})();

// Components - Conditions
const Conditions = ({
  fields,
  conditions,
  onConditionsChange,
}: ConditionsProps) => {
  const handleAddCondition = (afterIdx: number) => {
    const newConditions = [...conditions];
    newConditions.splice(afterIdx + 1, 0, createCondition());
    onConditionsChange(newConditions);
  };

  const handleRemoveCondition = (atIdx: number) => {
    if (conditions.length === 1) {
      // We don't remove the last condition
      // as there is no other way to add one.
      // If user would like all conditions removed
      // then they probably should remove the group
      return;
    }

    const remainingConditions = [...conditions];
    remainingConditions.splice(atIdx, 1);
    onConditionsChange(remainingConditions);
  };

  const handleConditionChange = (
    conditionIdx: number,
    newCondition: MatchCondition
  ) => {
    const newConditions = [...conditions];
    newConditions[conditionIdx] = newCondition;
    onConditionsChange(newConditions);
  };

  return (
    <>
      {conditions.map((condition, conditionIdx) => (
        <Condition
          key={condition.id}
          disableRemoveBtn={conditions.length === 1}
          fields={fields}
          condition={condition}
          onConditionChange={(newCondition) =>
            handleConditionChange(conditionIdx, newCondition)
          }
          onAddConditionClick={() => handleAddCondition(conditionIdx)}
          onRemoveConditionClick={() => handleRemoveCondition(conditionIdx)}
        />
      ))}
    </>
  );
};

export default Conditions;
