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

export const supportedDelimiters = [',', '\t', ';', ' '];
export type Delimiter = typeof supportedDelimiters[number];

export const supportedLinebreaks = ['\r\n', '\n'];
export type Linebreak = typeof supportedLinebreaks[number];

// the subset of bson types that we can detect
export type CSVDetectableFieldType =
  | 'int'
  | 'long'
  | 'double'
  | 'boolean'
  | 'date'
  | 'string'
  | 'objectId'
  | 'uuid'
  | 'regex'
  | 'minKey'
  | 'maxKey'
  // ejson is not a real type, but the fallback for otherwise unserializable
  // values like javascript, javascriptWithCode, DBRef (which itself is just a
  // convention, not a type) and whatever new types get added. It also covers
  // arrays and objects exported by mongoexport. So we detect those as ejson and
  // then we can import them.
  | 'ejson'
  | 'null'
  | 'undefined';

// the subset of bson types that we can parse
export type CSVParsableFieldType =
  | CSVDetectableFieldType
  | 'binData'
  | 'md5'
  | 'timestamp'
  | 'decimal'
  | 'number' // like 'mixed', but for use when everything is an int, long or double.
  | 'mixed';

export const CSVFieldTypeLabels: Record<CSVParsableFieldType, string> = {
  int: 'Int32',
  long: 'Long',
  double: 'Double',
  boolean: 'Boolean',
  date: 'Date',
  string: 'String',
  null: 'Null',
  undefined: 'Undefined',
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
