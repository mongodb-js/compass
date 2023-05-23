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

const andGroupWithConditionsAndNestedAndGroups = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        value: 'Compass',
        bsonType: 'String',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        value: '1.37',
        bsonType: 'String',
      });
      const nestedGroupA = createGroup({
        conditions: [conditionA, conditionB],
      });

      const conditionC = createCondition({
        field: 'downloadable',
        operator: '$eq',
        value: 'true',
        bsonType: 'Boolean',
      });
      const conditionD = createCondition({
        field: 'mode',
        operator: '$ne',
        value: 'standalone',
        bsonType: 'String',
      });
      const nestedGroupB = createGroup({
        conditions: [conditionC, conditionD],
      });

      const rootGroup = createGroup({
        conditions: [conditionA],
        nestedGroups: [nestedGroupA, nestedGroupB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $and: [
          { name: 'Compass' },
          {
            $and: [{ name: 'Compass' }, { version: '1.37' }],
          },
          {
            $and: [{ downloadable: true }, { mode: { $ne: 'standalone' } }],
          },
        ],
      };

      const compactClause: MatchExpression = verboseGroupClause;

      return [
        'andGroupWithConditionsAndNestedAndGroups',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const andGroupWithConditionsAndNestedAndOrGroups = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        value: 'Compass',
        bsonType: 'String',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        value: '1.37',
        bsonType: 'String',
      });
      const nestedGroupA = createGroup({
        conditions: [conditionA, conditionB],
      });

      const conditionC = createCondition({
        field: 'downloadable',
        operator: '$eq',
        value: 'true',
        bsonType: 'Boolean',
      });
      const conditionD = createCondition({
        field: 'mode',
        operator: '$ne',
        value: 'standalone',
        bsonType: 'String',
      });
      const nestedGroupB = createGroup({
        logicalOperator: '$or',
        conditions: [conditionC, conditionD],
      });

      const rootGroup = createGroup({
        conditions: [conditionA],
        nestedGroups: [nestedGroupA, nestedGroupB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $and: [
          { name: 'Compass' },
          {
            $and: [{ name: 'Compass' }, { version: '1.37' }],
          },
          {
            $or: [{ downloadable: true }, { mode: { $ne: 'standalone' } }],
          },
        ],
      };

      const compactClause: MatchExpression = verboseGroupClause;

      return [
        'andGroupWithConditionsAndNestedAndOrGroups',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const andGroupWithConditionsAndDeeplyNestedAndGroups = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        value: 'Compass',
        bsonType: 'String',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        value: '1.37',
        bsonType: 'String',
      });
      const nestedGroupA = createGroup({
        conditions: [conditionA, conditionB],
      });

      const conditionC = createCondition({
        field: 'downloadable',
        operator: '$eq',
        value: 'true',
        bsonType: 'Boolean',
      });
      const conditionD = createCondition({
        field: 'mode',
        operator: '$ne',
        value: 'standalone',
        bsonType: 'String',
      });
      const nestedGroupB = createGroup({
        conditions: [conditionC, conditionD],
        nestedGroups: [nestedGroupA],
      });

      const rootGroup = createGroup({
        conditions: [conditionA],
        nestedGroups: [nestedGroupB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $and: [
          { name: 'Compass' },
          {
            $and: [
              { downloadable: true },
              { mode: { $ne: 'standalone' } },
              {
                $and: [{ name: 'Compass' }, { version: '1.37' }],
              },
            ],
          },
        ],
      };

      const compactClause: MatchExpression = verboseGroupClause;

      return [
        'andGroupWithConditionsAndDeeplyNestedAndGroups',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const andGroupWithConditionsAndDeeplyNestedAndOrGroups = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        value: 'Compass',
        bsonType: 'String',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        value: '1.37',
        bsonType: 'String',
      });
      const nestedGroupA = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });

      const conditionC = createCondition({
        field: 'downloadable',
        operator: '$eq',
        value: 'true',
        bsonType: 'Boolean',
      });
      const conditionD = createCondition({
        field: 'mode',
        operator: '$ne',
        value: 'standalone',
        bsonType: 'String',
      });
      const nestedGroupB = createGroup({
        conditions: [conditionC, conditionD],
        nestedGroups: [nestedGroupA],
      });

      const rootGroup = createGroup({
        conditions: [conditionA],
        nestedGroups: [nestedGroupB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $and: [
          { name: 'Compass' },
          {
            $and: [
              { downloadable: true },
              { mode: { $ne: 'standalone' } },
              {
                $or: [{ name: 'Compass' }, { version: '1.37' }],
              },
            ],
          },
        ],
      };

      const compactClause: MatchExpression = verboseGroupClause;

      return [
        'andGroupWithConditionsAndDeeplyNestedAndOrGroups',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const orGroupWithConditionsAndNestedOrGroups = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        value: 'Compass',
        bsonType: 'String',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        value: '1.37',
        bsonType: 'String',
      });
      const nestedGroupA = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });

      const conditionC = createCondition({
        field: 'downloadable',
        operator: '$eq',
        value: 'true',
        bsonType: 'Boolean',
      });
      const conditionD = createCondition({
        field: 'mode',
        operator: '$ne',
        value: 'standalone',
        bsonType: 'String',
      });
      const nestedGroupB = createGroup({
        logicalOperator: '$or',
        conditions: [conditionC, conditionD],
      });

      const rootGroup = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA],
        nestedGroups: [nestedGroupA, nestedGroupB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $or: [
          { name: 'Compass' },
          {
            $or: [{ name: 'Compass' }, { version: '1.37' }],
          },
          {
            $or: [{ downloadable: true }, { mode: { $ne: 'standalone' } }],
          },
        ],
      };

      const compactClause: MatchExpression = verboseGroupClause;

      return [
        'orGroupWithConditionsAndNestedOrGroups',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const orGroupWithConditionsAndNestedAndOrGroups = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        value: 'Compass',
        bsonType: 'String',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        value: '1.37',
        bsonType: 'String',
      });
      const nestedGroupA = createGroup({
        conditions: [conditionA, conditionB],
      });

      const conditionC = createCondition({
        field: 'downloadable',
        operator: '$eq',
        value: 'true',
        bsonType: 'Boolean',
      });
      const conditionD = createCondition({
        field: 'mode',
        operator: '$ne',
        value: 'standalone',
        bsonType: 'String',
      });
      const nestedGroupB = createGroup({
        logicalOperator: '$or',
        conditions: [conditionC, conditionD],
      });

      const rootGroup = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA],
        nestedGroups: [nestedGroupA, nestedGroupB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $or: [
          { name: 'Compass' },
          {
            $and: [{ name: 'Compass' }, { version: '1.37' }],
          },
          {
            $or: [{ downloadable: true }, { mode: { $ne: 'standalone' } }],
          },
        ],
      };

      const compactClause: MatchExpression = verboseGroupClause;

      return [
        'orGroupWithConditionsAndNestedAndOrGroups',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const orGroupWithConditionsAndDeeplyNestedOrGroups = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        value: 'Compass',
        bsonType: 'String',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        value: '1.37',
        bsonType: 'String',
      });
      const nestedGroupA = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });

      const conditionC = createCondition({
        field: 'downloadable',
        operator: '$eq',
        value: 'true',
        bsonType: 'Boolean',
      });
      const conditionD = createCondition({
        field: 'mode',
        operator: '$ne',
        value: 'standalone',
        bsonType: 'String',
      });
      const nestedGroupB = createGroup({
        logicalOperator: '$or',
        conditions: [conditionC, conditionD],
        nestedGroups: [nestedGroupA],
      });

      const rootGroup = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA],
        nestedGroups: [nestedGroupB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $or: [
          { name: 'Compass' },
          {
            $or: [
              { downloadable: true },
              { mode: { $ne: 'standalone' } },
              {
                $or: [{ name: 'Compass' }, { version: '1.37' }],
              },
            ],
          },
        ],
      };

      const compactClause: MatchExpression = verboseGroupClause;

      return [
        'orGroupWithConditionsAndDeeplyNestedOrGroups',
        rootGroup,
        verboseGroupClause,
        compactClause,
      ];
    }
);

const orGroupWithConditionsAndDeeplyNestedAndOrGroups = withCreatorFuncs(
  ({ createCondition, createGroup }) =>
    () => {
      const conditionA = createCondition({
        field: 'name',
        operator: '$eq',
        value: 'Compass',
        bsonType: 'String',
      });
      const conditionB = createCondition({
        field: 'version',
        operator: '$eq',
        value: '1.37',
        bsonType: 'String',
      });
      const nestedGroupA = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA, conditionB],
      });

      const conditionC = createCondition({
        field: 'downloadable',
        operator: '$eq',
        value: 'true',
        bsonType: 'Boolean',
      });
      const conditionD = createCondition({
        field: 'mode',
        operator: '$ne',
        value: 'standalone',
        bsonType: 'String',
      });
      const nestedGroupB = createGroup({
        conditions: [conditionC, conditionD],
        nestedGroups: [nestedGroupA],
      });

      const rootGroup = createGroup({
        logicalOperator: '$or',
        conditions: [conditionA],
        nestedGroups: [nestedGroupB],
      });

      const verboseGroupClause: MatchGroupExpression = {
        $or: [
          { name: 'Compass' },
          {
            $and: [
              { downloadable: true },
              { mode: { $ne: 'standalone' } },
              {
                $or: [{ name: 'Compass' }, { version: '1.37' }],
              },
            ],
          },
        ],
      };

      const compactClause: MatchExpression = verboseGroupClause;

      return [
        'orGroupWithConditionsAndDeeplyNestedAndOrGroups',
        rootGroup,
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
  // no nested groups
  simpleAndGroup(),
  simpleAndGroupWithDiffOperators(),
  simpleAndGroupWithDuplicateConditions(),
  simpleOrGroup(),
  simpleOrGroupWithDiffOperators(),
  simpleOrGroupWithDuplicateConditions(),

  // nested groups
  andGroupWithConditionsAndNestedAndGroups(),
  andGroupWithConditionsAndNestedAndOrGroups(),
  andGroupWithConditionsAndDeeplyNestedAndGroups(),
  andGroupWithConditionsAndDeeplyNestedAndOrGroups(),
  orGroupWithConditionsAndNestedOrGroups(),
  orGroupWithConditionsAndNestedAndOrGroups(),
  orGroupWithConditionsAndDeeplyNestedOrGroups(),
  orGroupWithConditionsAndDeeplyNestedAndOrGroups(),
];
