import type {
  Double,
  Int32,
  Long,
  Binary,
  BSONRegExp,
  ObjectId,
  Timestamp,
  Decimal128,
  UUID,
  MinKey,
  MaxKey,
} from 'bson';

export const supportedDelimiters = [',', '\t', ';', ' '] as const;
export type Delimiter = typeof supportedDelimiters[number];

export const supportedLinebreaks = ['\r\n', '\n'] as const;
export type Linebreak = typeof supportedLinebreaks[number];

// the subset of bson types that we can detect
export const detectableFieldTypes = [
  'int',
  'long',
  'double',
  'boolean',
  'date',
  'string',
  'objectId',
  'uuid',
  'regex',
  'minKey',
  'maxKey',
  // ejson is not a real type, but the fallback for otherwise unserializable
  // values like javascript, javascriptWithCode, DBRef (which itself is just a
  // convention, not a type) and whatever new types get added. It also covers
  // arrays and objects exported by mongoexport. So we detect those as ejson and
  // then we can import them.
  'ejson',
  'null',
] as const;
export type CSVDetectableFieldType = typeof detectableFieldTypes[number];

// NOTE: 'undefined' exists internally for ignored empty strings, but it is
// deprecated as a bson type so we can't actually parse it, so it is left out of
// detectable and parsable field types.

// the subset of bson types that we can parse
export const parsableFieldTypes = [
  ...detectableFieldTypes,
  'binData',
  'md5',
  'timestamp',
  'decimal',
  'number', // like 'mixed', but for use when everything is an int, long or double.
  'mixed',
] as const;
export type CSVParsableFieldType = typeof parsableFieldTypes[number];

export const CSVFieldTypeLabels: Record<CSVParsableFieldType, string> = {
  int: 'Int32',
  long: 'Long',
  double: 'Double',
  boolean: 'Boolean',
  date: 'Date',
  string: 'String',
  null: 'Null',
  objectId: 'ObjectId',
  binData: 'Binary',
  uuid: 'UUID',
  md5: 'MD5',
  timestamp: 'Timestamp',
  decimal: 'Decimal128',
  regex: 'RegExpr',
  minKey: 'MinKey',
  maxKey: 'MaxKey',
  ejson: 'EJSON',
  number: 'Number',
  mixed: 'Mixed',
};

export type IncludedFields = Record<string, CSVParsableFieldType>;

export type CSVValue =
  | Double
  | Int32
  | Long
  | Date
  | boolean
  | string
  | null
  | Binary
  | Timestamp
  | ObjectId
  | BSONRegExp
  | Decimal128
  | UUID
  | MinKey
  | MaxKey;

// NOTE: The fact that PathPart has an "index" property in one case and "name"
// in the other rather than just one shared "value" is deliberate. It forces us
// to explicitly handle each case because more likely than not we want the two
// cases disambiguated when parsing or formatting.
export type PathPart =
  | {
      type: 'index';
      index: number;
    }
  | {
      type: 'field';
      name: string;
    };

export type CSVFieldTypeInfo = {
  // How many cells in the file matched this type.
  count: number;

  // The line in the file where this field was first detected to be of this
  // type. This is so the field type selector can immediately present that line
  // or document as a counter example if the user selects an incompatible field
  // type.
  firstRowIndex: number;
  firstColumnIndex: number;
  firstValue: string;
};

/*
For each field we need the detected types and the column positions. This helps
with accounting for all column indexes, but also the fact that we'd have higher
counts than the number of rows. ie. foo[0],foo[1] means twice as many fields as
rows once it becomes field foo and so does foo[0].bar,foo[1].bar once it becomes
foo.bar.
*/
export type CSVField = {
  types: Record<CSVDetectableFieldType | 'undefined', CSVFieldTypeInfo>;
  columnIndexes: number[];
  detected: CSVParsableFieldType;
};
