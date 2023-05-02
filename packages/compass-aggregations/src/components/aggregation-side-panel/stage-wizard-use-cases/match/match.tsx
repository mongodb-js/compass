import React, { useState } from 'react';
import TypeChecker from 'hadron-type-checker';
import queryParser from 'mongodb-query-parser';
import { css, spacing } from '@mongodb-js/compass-components';

import type { WizardComponentProps } from '..';
import Group, { createGroup } from './group';

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
  groups: MatchConditionGroup[];
};

export type ConditionClause =
  | { [field: string]: unknown }
  | { [field: string]: { [operator in MatchOperator]: unknown } };

export type GroupClause = {
  [$andOr in LogicalOperator]?: (ConditionClause | GroupClause)[];
};

export type CompactClause =
  | ConditionClause
  | { [$andOr in LogicalOperator]: CompactClause[] };

// Helpers
export function isNotEmptyCondition(condition: MatchCondition): boolean {
  return !!(condition.field && condition.bsonType);
}

export function areUniqueClauses(clauses: ConditionClause[]): boolean {
  const clausesAsObject = {};
  for (const clause of clauses) {
    Object.assign(clausesAsObject, clause);
  }
  return Object.keys(clausesAsObject).length === clauses.length;
}

export function isConditionClause(
  clause: ConditionClause | GroupClause
): boolean {
  return !('$and' in clause) && !('$or' in clause);
}

export function toConditionClause(condition: MatchCondition): ConditionClause {
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

/**
 * Makes a verbose $match stage value from a MatchConditionGroup
 * For examples refer the test cases in match.spec.tsx
 */
export function toGroupClause({
  logicalOperator,
  conditions,
  groups,
}: MatchConditionGroup): GroupClause {
  const conditionExpressions = conditions
    .filter(isNotEmptyCondition)
    .map(toConditionClause);
  const groupExpressions = groups.map(toGroupClause);
  return {
    [logicalOperator]: [...conditionExpressions, ...groupExpressions],
  };
}

/**
 * Makes a compact $match stage value from a GroupClause
 * For examples refer the test cases in match.spec.tsx
 */
export function makeCompactGroupClause(group: GroupClause): CompactClause {
  const compactClause: CompactClause = {};
  const groupEntries = Object.entries(group);
  for (const [operator, clauses] of groupEntries) {
    /**
     * We make compact clause for a group only when it is a list of
     * ConditionClause and each clause in the set of clauses has unique key
     * value pairs. Otherwise there is no guarantee that the compaction of
     * clauses will not result in accidental overriding of already existing
     * clauses or even each other.
     */
    const canMakeCompactClause =
      operator === '$and' &&
      clauses.every(isConditionClause) &&
      areUniqueClauses(clauses) &&
      /**
       * This condition is very unlikely based on our types for GroupClause but
       * because a GroupClause is just an object, it can theoretically have more
       * than one keys in which case we shouldn't compact our clauses to avoid
       * accidental overriding of other clauses within this group
       */
      groupEntries.length === 1;

    if (canMakeCompactClause) {
      for (const clause of clauses) {
        Object.assign<CompactClause, ConditionClause>(compactClause, clause);
      }
    } else {
      /**
       * Since we cannot make compact clauses for this group, we try to make
       * compact clauses for any subgroups of this group, if possible.
       */
      const possiblyCompactClauses: CompactClause[] = [];
      for (const clause of clauses) {
        if (isConditionClause(clause)) {
          possiblyCompactClauses.push(clause);
        } else {
          possiblyCompactClauses.push(makeCompactGroupClause(clause));
        }
      }
      compactClause[operator] = possiblyCompactClauses;
    }
  }
  return compactClause;
}

export function mapMatchFormStateToMatchStage(matchGroup: MatchConditionGroup) {
  const verboseGroupClause = toGroupClause(matchGroup);
  return makeCompactGroupClause(verboseGroupClause);
}

const formContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
});

const MatchForm = ({ fields, onChange }: WizardComponentProps) => {
  const [matchGroup, setMatchGroup] = useState<MatchConditionGroup>(
    createGroup()
  );

  const handleGroupChange = (changedGroup: MatchConditionGroup) => {
    setMatchGroup(changedGroup);
    try {
      const matchStage = mapMatchFormStateToMatchStage(changedGroup);
      onChange(queryParser.toJSString(matchStage), null);
    } catch (error) {
      onChange('{}', error as Error);
    }
  };

  return (
    <div className={formContainerStyles}>
      <Group
        key={matchGroup.id}
        fields={fields}
        nestingLevel={0}
        group={matchGroup}
        onGroupChange={handleGroupChange}
      />
    </div>
  );
};

export default MatchForm;
