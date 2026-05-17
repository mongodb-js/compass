// Operators supported by the Visual Query Builder. Kept intentionally narrow
// so each one round-trips cleanly through serialize / try-parse.
export const VISUAL_BUILDER_OPERATORS = [
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$nin',
  '$regex',
  '$exists',
  '$size',
] as const;

export type VisualBuilderOperator = (typeof VISUAL_BUILDER_OPERATORS)[number];

type OperatorTableEntry = {
  operators: readonly VisualBuilderOperator[];
  default: VisualBuilderOperator;
};

// Operators offered per BSON type name as reported by `mongodb-schema`.
export const OPERATORS_BY_TYPE: Readonly<Record<string, OperatorTableEntry>> = {
  String: {
    operators: ['$eq', '$ne', '$in', '$nin', '$regex', '$exists'],
    default: '$eq',
  },
  Number: {
    operators: [
      '$eq',
      '$ne',
      '$gt',
      '$gte',
      '$lt',
      '$lte',
      '$in',
      '$nin',
      '$exists',
    ],
    default: '$eq',
  },
  Double: {
    operators: [
      '$eq',
      '$ne',
      '$gt',
      '$gte',
      '$lt',
      '$lte',
      '$in',
      '$nin',
      '$exists',
    ],
    default: '$eq',
  },
  Int32: {
    operators: [
      '$eq',
      '$ne',
      '$gt',
      '$gte',
      '$lt',
      '$lte',
      '$in',
      '$nin',
      '$exists',
    ],
    default: '$eq',
  },
  Long: {
    operators: [
      '$eq',
      '$ne',
      '$gt',
      '$gte',
      '$lt',
      '$lte',
      '$in',
      '$nin',
      '$exists',
    ],
    default: '$eq',
  },
  Decimal128: {
    operators: [
      '$eq',
      '$ne',
      '$gt',
      '$gte',
      '$lt',
      '$lte',
      '$in',
      '$nin',
      '$exists',
    ],
    default: '$eq',
  },
  Date: {
    operators: ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$exists'],
    default: '$gte',
  },
  ObjectId: {
    operators: ['$eq', '$ne', '$in', '$nin', '$exists'],
    default: '$eq',
  },
  Boolean: {
    operators: ['$eq', '$ne', '$exists'],
    default: '$eq',
  },
  Null: {
    operators: ['$eq', '$ne', '$exists'],
    default: '$eq',
  },
  Array: {
    operators: ['$in', '$nin', '$size', '$exists'],
    default: '$in',
  },
  Document: {
    operators: ['$exists'],
    default: '$exists',
  },
  Regex: {
    operators: ['$regex', '$exists'],
    default: '$regex',
  },
  _default: {
    operators: ['$eq', '$ne', '$exists'],
    default: '$eq',
  },
};

export function getOperatorsForType(
  bsonType: string | string[] | undefined
): OperatorTableEntry {
  if (typeof bsonType === 'string' && OPERATORS_BY_TYPE[bsonType]) {
    return OPERATORS_BY_TYPE[bsonType];
  }
  return OPERATORS_BY_TYPE._default;
}

export function normalizeBsonType(
  bsonType: string | string[] | undefined
): string {
  if (typeof bsonType === 'string' && OPERATORS_BY_TYPE[bsonType]) {
    return bsonType;
  }
  // Polymorphic or unknown fields fall back to the conservative default set.
  return '_default';
}

// Operators that have no value editor (just the field path + operator).
export const VALUELESS_OPERATORS: readonly VisualBuilderOperator[] = [
  '$exists',
];

// Operators whose value is a comma-separated list of scalars.
export const LIST_OPERATORS: readonly VisualBuilderOperator[] = ['$in', '$nin'];
