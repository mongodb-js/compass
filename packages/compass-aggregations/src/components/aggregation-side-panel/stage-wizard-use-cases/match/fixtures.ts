import { makeCreateGroup } from './group';
import { makeCreateCondition } from './condition';
import type { CreateGroupFn } from './group';
import type { CreateConditionFn } from './condition';
import type { CompactClause, GroupClause, MatchConditionGroup } from './match';
import type { Fields } from '..';

type PartialFunc = (funcs: {
  createGroup: CreateGroupFn;
  createCondition: CreateConditionFn;
}) => () => Fixture;

type Fixture = [string, MatchConditionGroup, GroupClause, CompactClause];

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

      const verboseGroupClause: GroupClause = {
        $and: [{ name: 'Compass' }, { version: 'Standalone' }],
      };

      const compactClause: CompactClause = {
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

      const verboseGroupClause: GroupClause = {
        $and: [{ name: 'Compass' }, { version: { $ne: 'Standalone' } }],
      };

      const compactClause: CompactClause = {
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

const andGroupWithNestedAndGroupOfConditions = withCreatorFuncs(
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
      const subGroup = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB],
      });
      const rootGroup = createGroup({
        logicalOperator: '$and',
        conditions: [],
        groups: [subGroup],
      });

      const verboseGroupClause: GroupClause = {
        $and: [
          {
            $and: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      const compactClause: CompactClause = {
        $and: [
          {
            name: 'Compass',
            version: 'Standalone',
          },
        ],
      };

      return [
        'andGroupWithNestedAndGroupOfConditions',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const andGroupWithNestedAndGroupsOfConditions = withCreatorFuncs(
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
      const andSubGroup1 = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB],
      });
      const andSubGroup2 = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB],
      });

      const rootGroup = createGroup({
        logicalOperator: '$and',
        conditions: [],
        groups: [andSubGroup1, andSubGroup2],
      });

      const verboseGroupClause: GroupClause = {
        $and: [
          {
            $and: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
          {
            $and: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      const compactClause: CompactClause = {
        $and: [
          {
            name: 'Compass',
            version: 'Standalone',
          },
          {
            name: 'Compass',
            version: 'Standalone',
          },
        ],
      };

      return [
        'andGroupWithNestedAndGroupsOfConditions',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const andGroupWithNestedAndOrGroupsOfConditions = withCreatorFuncs(
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
      const andSubGroup1 = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB],
      });
      const andSubGroup2 = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });

      const rootGroup = createGroup({
        logicalOperator: '$and',
        conditions: [],
        groups: [andSubGroup1, andSubGroup2],
      });

      const verboseGroupClause: GroupClause = {
        $and: [
          {
            $and: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
          {
            $or: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      const compactClause: CompactClause = {
        $and: [
          {
            name: 'Compass',
            version: 'Standalone',
          },
          {
            $or: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      return [
        'andGroupWithNestedAndOrGroupsOfConditions',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const andGroupWithAConditionAndNestedAndGroupOfConditions = withCreatorFuncs(
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
        field: 'theme',
        operator: '$eq',
        bsonType: 'String',
        value: 'Dark',
      });
      const subGroup = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB],
      });
      const rootGroup = createGroup({
        logicalOperator: '$and',
        conditions: [conditionC],
        groups: [subGroup],
      });

      const verboseGroupClause: GroupClause = {
        $and: [
          { theme: 'Dark' },
          {
            $and: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      const compactClause: CompactClause = {
        $and: [
          { theme: 'Dark' },
          {
            name: 'Compass',
            version: 'Standalone',
          },
        ],
      };

      return [
        'andGroupWithAConditionAndNestedAndGroupOfConditions',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const andGroupWithDeepNestedAndGroupsOfConditions = withCreatorFuncs(
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
      const andSubGroupAtLevel2 = createGroup({
        logicalOperator: '$and',
        conditions: [conditionA, conditionB],
      });
      const andSubGroupAtLevel1 = createGroup({
        logicalOperator: '$and',
        groups: [andSubGroupAtLevel2],
      });

      const rootGroup = createGroup({
        logicalOperator: '$and',
        conditions: [],
        groups: [andSubGroupAtLevel1],
      });

      const verboseGroupClause: GroupClause = {
        $and: [
          {
            $and: [
              {
                $and: [{ name: 'Compass' }, { version: 'Standalone' }],
              },
            ],
          },
        ],
      };

      const compactClause: CompactClause = {
        $and: [
          {
            $and: [
              {
                name: 'Compass',
                version: 'Standalone',
              },
            ],
          },
        ],
      };

      return [
        'andGroupWithDeepNestedAndGroupsOfConditions',
        rootGroup,
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

      const verboseGroupClause: GroupClause = {
        $or: [{ name: 'Compass' }, { version: 'Standalone' }],
      };

      const compactClause: CompactClause = {
        $or: [{ name: 'Compass' }, { version: 'Standalone' }],
      };

      return ['simpleOrGroup', group, verboseGroupClause, compactClause];
    }
);

const orGroupWithNestedOrGroupOfConditions = withCreatorFuncs(
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
      const subGroup = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });
      const rootGroup = createGroup({
        logicalOperator: '$or',
        conditions: [],
        groups: [subGroup],
      });

      const verboseGroupClause: GroupClause = {
        $or: [
          {
            $or: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      const compactClause: CompactClause = {
        $or: [
          {
            $or: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      return [
        'orGroupWithNestedOrGroupOfConditions',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const orGroupWithAConditionAndNestedOrGroupOfConditions = withCreatorFuncs(
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
        field: 'theme',
        operator: '$eq',
        bsonType: 'String',
        value: 'Dark',
      });
      const subGroup = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });
      const rootGroup = createGroup({
        logicalOperator: '$or',
        conditions: [conditionC],
        groups: [subGroup],
      });

      const verboseGroupClause: GroupClause = {
        $or: [
          { theme: 'Dark' },
          {
            $or: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      const compactClause: CompactClause = {
        $or: [
          { theme: 'Dark' },
          {
            $or: [{ name: 'Compass' }, { version: 'Standalone' }],
          },
        ],
      };

      return [
        'orGroupWithAConditionAndNestedOrGroupOfConditions',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

export const SAMPLE_FIELDS: Fields = [
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
  andGroupWithNestedAndGroupOfConditions(),
  andGroupWithNestedAndGroupsOfConditions(),
  andGroupWithNestedAndOrGroupsOfConditions(),
  andGroupWithAConditionAndNestedAndGroupOfConditions(),
  andGroupWithDeepNestedAndGroupsOfConditions(),
  simpleOrGroup(),
  orGroupWithNestedOrGroupOfConditions(),
  orGroupWithAConditionAndNestedOrGroupOfConditions(),
];
