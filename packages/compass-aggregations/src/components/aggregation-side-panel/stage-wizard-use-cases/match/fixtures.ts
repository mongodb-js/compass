import { makeCreateGroup } from './match-group-form';
import { makeCreateCondition } from './match-condition-form';
import type { CreateGroupFn } from './match-group-form';
import type { CreateConditionFn } from './match-condition-form';
import type {
  MatchExpression,
  MatchGroupExpression,
  MatchGroup,
} from './match';
import type { StageWizardFields } from '..';

type PartialFunc = (funcs: {
  createGroup: CreateGroupFn;
  createCondition: CreateConditionFn;
}) => () => Fixture;

type Fixture = [string, MatchGroup, MatchGroupExpression, MatchExpression];

function withCreatorFuncs(fn: PartialFunc) {
  const createCondition = makeCreateCondition();
  const createGroup = makeCreateGroup(createCondition);
  return fn({ createGroup, createCondition });
}

// MatchConditionGroup -> GroupClause
const simpleAndGroup = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        bsonType: 'String',
        value: 'Compass',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        bsonType: 'String',
        value: 'Standalone',
      });
      const group = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $and: [{ name: 'Compass' }, { version: 'Standalone' }],
      };

      const compactClause: MatchExpression = {
        name: 'Compass',
        version: 'Standalone',
      };

      return ['simpleAndGroup', group, verboseGroupClause, compactClause];
    }
);

const simpleAndGroupWithDiffOperators = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        bsonType: 'String',
        value: 'Compass',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$ne',
        bsonType: 'String',
        value: 'Standalone',
      });
      const group = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $and: [{ name: 'Compass' }, { version: { $ne: 'Standalone' } }],
      };

      const compactClause: MatchExpression = {
        name: 'Compass',
        version: { $ne: 'Standalone' },
      };

      return [
        'simpleAndGroupWithDiffOperators',
        group,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const simpleAndGroupWithDuplicateConditions = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        bsonType: 'String',
        value: 'Compass',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        bsonType: 'String',
        value: 'Standalone',
      });
      const conditionC = createCondition({
        field: 'name',
        operator: '$ne',
        bsonType: 'String',
        value: 'Mongosh',
      });
      const group = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB, conditionC],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $and: [
          { name: 'Compass' },
          { version: 'Standalone' },
          { name: { $ne: 'Mongosh' } },
        ],
      };

      const compactClause: MatchExpression = {
        $and: [
          { name: 'Compass' },
          { version: 'Standalone' },
          { name: { $ne: 'Mongosh' } },
        ],
      };

      return [
        'simpleAndGroupWithDuplicateConditions',
        group,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const simpleOrGroup = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        bsonType: 'String',
        value: 'Compass',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        bsonType: 'String',
        value: 'Standalone',
      });
      const group = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $or: [{ name: 'Compass' }, { version: 'Standalone' }],
      };

      const compactClause: MatchExpression = {
        $or: [{ name: 'Compass' }, { version: 'Standalone' }],
      };

      return ['simpleOrGroup', group, verboseGroupClause, compactClause];
    }
);

const simpleOrGroupWithDiffOperators = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        bsonType: 'String',
        value: 'Compass',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$ne',
        bsonType: 'String',
        value: 'Standalone',
      });
      const group = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $or: [{ name: 'Compass' }, { version: { $ne: 'Standalone' } }],
      };

      const compactClause: MatchExpression = {
        $or: [{ name: 'Compass' }, { version: { $ne: 'Standalone' } }],
      };

      return [
        'simpleOrGroupWithDiffOperators',
        group,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const simpleOrGroupWithDuplicateConditions = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        bsonType: 'String',
        value: 'Compass',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        bsonType: 'String',
        value: 'Standalone',
      });
      const conditionC = createCondition({
        field: 'name',
        operator: '$ne',
        bsonType: 'String',
        value: 'Mongosh',
      });
      const group = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB, conditionC],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $or: [
          { name: 'Compass' },
          { version: 'Standalone' },
          { name: { $ne: 'Mongosh' } },
        ],
      };

      const compactClause: MatchExpression = {
        $or: [
          { name: 'Compass' },
          { version: 'Standalone' },
          { name: { $ne: 'Mongosh' } },
        ],
      };

      return [
        'simpleOrGroupWithDuplicateConditions',
        group,
        verboseGroupClause,
        compactClause,
      ];
    }
);

export const SAMPLE_FIELDS: StageWizardFields = [
  {
    name: '_id',
    type: 'ObjectId',
  },
  {
    name: 'name',
    type: 'String',
  },
  {
    name: 'age',
    type: 'Double',
  },
  {
    name: 'isActive',
    type: 'Boolean',
  },
  {
    name: 'doj',
    type: 'Date',
  },
];

export default [
  simpleAndGroup(),
  simpleAndGroupWithDiffOperators(),
  simpleAndGroupWithDuplicateConditions(),
  simpleOrGroup(),
  simpleOrGroupWithDiffOperators(),
  simpleOrGroupWithDuplicateConditions(),
];
