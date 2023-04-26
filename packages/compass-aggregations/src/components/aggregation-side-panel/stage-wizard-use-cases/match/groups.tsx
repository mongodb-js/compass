import React from 'react';
import Group from './group';
import { createCondition } from './condition';
import type { MatchConditionGroup, MatchConditionGroups } from './match';
import type { WizardComponentProps } from '..';

// Types
type GroupsProps = {
  nestingLevel: number;
  fields: WizardComponentProps['fields'];
  groups: MatchConditionGroups;
  onGroupsChange: (newGroups: MatchConditionGroups) => void;
};

// Helpers
export const createGroup = (() => {
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
})();

export const makeAddGroupHandler = (
  groups: MatchConditionGroups,
  onGroupsChange: (newGroups: MatchConditionGroups) => void
) => {
  return () => {
    if (groups.length > 1) {
      // There can only be two groups ($and and $or)
      // at any nesting level.
      return;
    }

    const existingGroup = groups[0];
    const alreadySelectedOperator = existingGroup?.logicalOperator;
    const newGroupOperator =
      alreadySelectedOperator === '$and' ? '$or' : '$and';
    const newGroups: MatchConditionGroups = [
      ...groups,
      createGroup({ logicalOperator: newGroupOperator }),
    ];
    onGroupsChange(newGroups);
  };
};

// Components - Groups
const Groups = ({
  nestingLevel,
  fields,
  groups,
  onGroupsChange,
}: GroupsProps) => {
  const handleAddGroupClick = makeAddGroupHandler(groups, onGroupsChange);

  const handleGroupChange = (
    groupIdx: number,
    newGroup: MatchConditionGroup
  ) => {
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
  };

  const handleRemoveGroupClick = (groupIdx: number) => {
    const newGroups = [...groups];
    newGroups.splice(groupIdx, 1);
    onGroupsChange(newGroups);
  };

  return (
    <>
      {groups.map((group, groupIdx) => (
        <Group
          key={group.id}
          fields={fields}
          nestingLevel={nestingLevel}
          hideAddGroup={nestingLevel !== 0 || groups.length === 2}
          disableRemoveGroup={nestingLevel === 0 && groups.length === 1}
          group={group}
          onGroupChange={(newGroup) => handleGroupChange(groupIdx, newGroup)}
          onRemoveGroupClick={() => handleRemoveGroupClick(groupIdx)}
          onAddGroupClick={() => handleAddGroupClick()}
        />
      ))}
    </>
  );
};

export default Groups;
