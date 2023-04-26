import React, { useEffect, useState } from 'react';
import TypeChecker from 'hadron-type-checker';
import { css, spacing } from '@mongodb-js/compass-components';

import type { WizardComponentProps } from '..';
import queryParser from 'mongodb-query-parser';
import Group, { makeGroupsHandlers, createGroup } from './group';

// Types
export type LogicalOperator = '$or' | '$and';
export type MatchOperator = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte';
export type MatchCondition = {
  id: number;
  field: string;
  value: string;
  bsonType: string;
  operator: MatchOperator;
};
export type MatchConditionGroup = {
  id: number;
  logicalOperator: LogicalOperator;
  conditions: MatchCondition[];
  groups: MatchConditionGroups;
};
export type MatchConditionGroups = MatchConditionGroup[];

// Helpers
export function isNotEmptyCondition(condition: MatchCondition) {
  return condition.field && condition.bsonType;
}

export type MappedCondition =
  | { [field: string]: unknown }
  | { [field: string]: { [operator in MatchOperator]: unknown } };

export function mapCondition(condition: MatchCondition): MappedCondition {
  if (condition.operator === '$eq') {
    return {
      [condition.field]: TypeChecker.cast(condition.value, condition.bsonType),
    };
  } else {
    return {
      [condition.field]: {
        [condition.operator]: TypeChecker.cast(
          condition.value,
          condition.bsonType
        ),
      },
    };
  }
}

type MappedAndGroup = {
  $and?: MappedCondition[] | [MappedAndGroup] | [MappedOrGroup];
};

type MappedOrGroup = {
  $or?: MappedCondition[] | [MappedAndGroup] | [MappedOrGroup];
};

export type MappedGroups = MappedCondition & MappedAndGroup & MappedOrGroup;

export function mapGroups(
  groups: MatchConditionGroups,
  allowConciseSyntax: boolean
): MappedGroups {
  const reducedGroups: MappedGroups = {};
  for (const group of groups) {
    const mappedConditions = group.conditions
      .filter(isNotEmptyCondition)
      .map(mapCondition);
    const reducedSubGroups = mapGroups(
      group.groups,
      allowConciseSyntax && group.logicalOperator === '$and'
    );

    // If possible we try to return a concise syntax for the reduced
    // $and group. Concise syntax can only be returned when:
    //  - there is only one $and group in the list of groups at any level
    //  - the only $and group is not a subgroup of $or
    // Verbose Syntax Example: { $and: [{ name: "Compass" }, { platform: "MAC" }] }
    // Concise Syntax Example: { name: "Compass", platform: "MAC" }
    if (
      allowConciseSyntax &&
      groups.length === 1 &&
      group.logicalOperator === '$and'
    ) {
      for (const condition of mappedConditions) {
        for (const field in condition) {
          reducedGroups[field] = condition[field];
        }
      }
      for (const key in reducedSubGroups) {
        reducedGroups[key] = reducedSubGroups[key];
      }
      return reducedGroups;
    }

    const mappedSubGroups = Object.entries(reducedSubGroups).map(
      ([key, value]) => ({
        [key]: value,
      })
    );
    const conditions = [...mappedConditions, ...mappedSubGroups];
    // We will populate the operator in the reduced groups
    // only when there are conditions for that operator
    if (conditions.length) {
      reducedGroups[group.logicalOperator] = conditions;
    }
  }

  return reducedGroups;
}

export function mapMatchFormStateToMatchStage(
  matchGroups: MatchConditionGroups
) {
  return mapGroups(matchGroups, true);
}

const formContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
});

const MatchForm = ({ fields, onChange }: WizardComponentProps) => {
  const [matchGroups, setMatchGroups] = useState<MatchConditionGroups>([
    createGroup(),
  ]);

  useEffect(() => {
    try {
      const matchStage = mapMatchFormStateToMatchStage(matchGroups);
      onChange(queryParser.toJSString(matchStage), null);
    } catch (error) {
      onChange(queryParser.toJSString({}), error as Error);
    }
  }, [matchGroups, onChange]);

  const groupsHandlers = makeGroupsHandlers(matchGroups, (newGroups) =>
    setMatchGroups(newGroups)
  );

  return (
    <div className={formContainerStyles}>
      {matchGroups.map((group, groupIdx) => (
        <Group
          key={group.id}
          fields={fields}
          nestingLevel={0}
          disableAddGroup={matchGroups.length === 2}
          disableRemoveGroup={matchGroups.length === 1}
          group={group}
          onGroupChange={(changedGroup) => {
            groupsHandlers.handleGroupChange(groupIdx, changedGroup);
          }}
          onRemoveGroupClick={() =>
            groupsHandlers.handleRemoveGroupClick(groupIdx)
          }
          onAddGroupClick={() => groupsHandlers.handleAddGroupClick()}
        />
      ))}
    </div>
  );
};

export default MatchForm;
