import React, { useState } from 'react';
import TypeChecker from 'hadron-type-checker';
import queryParser from 'mongodb-query-parser';
import { css, spacing } from '@mongodb-js/compass-components';
import Group, { createGroup } from './group';

import type { WizardComponentProps } from '..';
import type { TypeCastTypes } from 'hadron-type-checker';

// Types
export type LogicalOperator = '$or' | '$and';
export type MatchOperator = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte';
export type MatchCondition = {
  id: number;
  field: string;
  value: string;
  bsonType: TypeCastTypes;
  operator: MatchOperator;
};
export type MatchGroup = {
  id: number;
  logicalOperator: LogicalOperator;
  conditions: MatchCondition[];
};

export type MatchConditionExpression =
  | { [field: string]: unknown }
  | { [field: string]: { [operator in MatchOperator]: unknown } };

export type MatchGroupExpression =
  | { [$andOr in LogicalOperator]?: MatchConditionExpression[] };

export type MatchExpression = MatchConditionExpression | MatchGroupExpression;

// Helpers
export function isNotEmptyCondition(condition: MatchCondition): boolean {
  return !!(condition.field && condition.bsonType);
}

export function areUniqueExpressions(
  expressions: MatchConditionExpression[]
): boolean {
  const expressionKeys: string[] = [];
  for (const expression of expressions) {
    expressionKeys.push(...Object.keys(expression));
  }
  return new Set(expressionKeys).size === expressionKeys.length;
}

export function toMatchConditionExpression(
  condition: MatchCondition
): MatchConditionExpression {
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
export function toMatchGroupExpression({
  logicalOperator,
  conditions,
}: MatchGroup): MatchGroupExpression {
  const conditionExpressions = conditions
    .filter(isNotEmptyCondition)
    .map(toMatchConditionExpression);

  return { [logicalOperator]: conditionExpressions };
}

export function makeCompactGroupExpression(
  groupExpression: MatchGroupExpression
) {
  const compactExpression: MatchExpression = {};
  const groupExpressionsEntries = Object.entries(groupExpression);
  for (const [operator, expressions] of groupExpressionsEntries) {
    const canMakeCompactExpression =
      operator === '$and' && areUniqueExpressions(expressions);

    if (canMakeCompactExpression) {
      for (const expression of expressions) {
        Object.assign<MatchExpression, MatchConditionExpression>(
          compactExpression,
          expression
        );
      }
    } else {
      compactExpression[operator as LogicalOperator] = expressions;
    }
  }
  return compactExpression;
}

export function mapMatchFormStateToMatchStage(matchGroup: MatchGroup) {
  const verboseGroupClause = toMatchGroupExpression(matchGroup);
  return makeCompactGroupExpression(verboseGroupClause);
}

const formContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
});

const MatchForm = ({ fields, onChange }: WizardComponentProps) => {
  const [matchGroup, setMatchGroup] = useState<MatchGroup>(createGroup());

  const handleGroupChange = (changedGroup: MatchGroup) => {
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
        group={matchGroup}
        onGroupChange={handleGroupChange}
      />
    </div>
  );
};

export default MatchForm;
