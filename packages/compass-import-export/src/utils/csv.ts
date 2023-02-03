import _ from 'lodash';
import assert from 'assert';
import type { Document } from 'mongodb';
import {
  Double,
  Int32,
  Long,
  Binary,
  BSONRegExp,
  ObjectId,
  Timestamp,
  Decimal128,
  UUID,
} from 'bson';

export const supportedDelimiters = [',', '\t', ';', ' '];
export type Delimiter = typeof supportedDelimiters[number];

// the subset of bson types that we can detect
export type CSVDetectableFieldType =
  | 'int'
  | 'long'
  | 'double'
  | 'boolean'
  | 'date'
  | 'string'
  | 'null'
  | 'undefined';

// the subset of bson types that we can parse
export type CSVParsableFieldType =
  | CSVDetectableFieldType
  | 'objectId'
  | 'binData'
  | 'uuid'
  | 'md5'
  | 'timestamp'
  | 'decimal'
  | 'regex'
  | 'number'
  | 'mixed';

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
  | UUID;

export function csvHeaderNameToFieldName(name: string) {
  return name.replace(/\[\d+\]/g, '');
}

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

const MIN_INT = -2147483648;
const MAX_INT = 2147483647;
const MIN_LONG = BigInt('-9223372036854775808');
const MAX_LONG = BigInt('9223372036854775807');
// from papaparse: https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1024
const FLOAT = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/;
// from papaparse: https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1025
const ISO_DATE =
  /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/;
const TRUTHY_STRINGS = ['true', 'TRUE', 'True'];
const FALSY_STRINGS = ['false', 'FALSE', 'False'];
const NULL_STRINGS = ['Null', 'NULL', 'null'];

export function detectFieldType(
  value: string,
  ignoreEmptyStrings?: boolean
): CSVDetectableFieldType {
  if (value === '') {
    return ignoreEmptyStrings ? 'undefined' : 'string';
  } else if (NULL_STRINGS.includes(value)) {
    return 'null';
  } else if (TRUTHY_STRINGS.includes(value)) {
    return 'boolean';
  } else if (FALSY_STRINGS.includes(value)) {
    return 'boolean';
  } else if (FLOAT.test(value)) {
    // first separate floating point numbers from integers

    // 1.0 should be double
    if (value.includes('.') || /[Ee][+-]?/.test(value)) {
      return 'double';
    }

    let number;
    try {
      number = BigInt(value);
    } catch (err) {
      // just in case something makes it past the regex by accident
      return 'string';
    }

    // then separate ints from longs
    if (number >= MIN_LONG && number <= MAX_LONG) {
      if (number >= MIN_INT && number <= MAX_INT) {
        return 'int';
      }
      return 'long';
    }

    // really big integers will remain as strings
    return 'string';
  } else if (ISO_DATE.test(value)) {
    return 'date';
  }

  return 'string';
}

export function placeValue(
  doc: Document,
  path: PathPart[],
  value: any,
  overwrite?: boolean
): any {
  if (path.length === 0) {
    return;
  }

  const lastPart = path[path.length - 1];

  const ensure = (parentValue: any): any => {
    return path.length === 1
      ? doc
      : placeValue(doc, path.slice(0, path.length - 1), parentValue);
  };

  if (lastPart.type === 'field') {
    const parent = ensure({});

    // You could get here if a field is more than one of a) a simple value, b)
    // an array, c) an object all in the same CSV row. That's not possible in
    // the database and it therefore shouldn't be possible in files we generate
    // on export, but it is possible to hand-craft a broken file like that.
    // (Also checking _bsontype because `new Int32()` also results in an object,
    // but that's not what we mean.)
    assert(
      _.isObject(parent) &&
        !(parent as Document)._bsontype &&
        !Array.isArray(parent),
      'parent must be an object'
    );

    if (overwrite || (parent as Document)[lastPart.name] === undefined) {
      (parent as Document)[lastPart.name] = value;
    }

    return (parent as Document)[lastPart.name];
  } else {
    const parent = ensure([]);

    // Same story as for the isObject() assertion above.
    assert(Array.isArray(parent), 'parent must be an array');

    if (overwrite || parent[lastPart.index] === undefined) {
      parent[lastPart.index] = value;
    }

    return parent[lastPart.index];
  }
}

export function makeDoc(
  chunk: Record<string, string>,
  header: string[],
  parsedHeader: Record<string, PathPart[]>,
  included: IncludedFields,
  { ignoreEmptyStrings }: { ignoreEmptyStrings?: boolean }
): Document {
  const doc: Document = {};

  // in order of the header row
  for (const [index, name] of header.entries()) {
    const fieldName = csvHeaderNameToFieldName(name);

    // ignore fields that were exluded by the user
    if (included[fieldName] === undefined) {
      continue;
    }

    let original = chunk[name];

    // Blanks at the end become undefined and not empty strings, but we want to
    // treat them the same.
    if (original === undefined) {
      original = '';
    }

    // Ignore the field for this doc if it is an empty string and the user chose
    // to ignore empty strings. Otherwise it will become null.
    if (original === '' && ignoreEmptyStrings) {
      continue;
    }

    let type = included[fieldName];
    if (type === 'mixed') {
      type = detectFieldType(original, ignoreEmptyStrings);
    }
    if (type === 'number') {
      type = detectFieldType(original, ignoreEmptyStrings);
      if (!['int', 'long', 'double'].includes(type)) {
        throw new Error(
          `"${original}" is not a number (found "${type}") [Col ${index}]`
        );
      }
    }

    const path = parsedHeader[name];

    try {
      const value = parseValue(original, type);

      placeValue(doc, path, value, true);
    } catch (err: unknown) {
      // rethrow with the column index appended to aid debugging
      (err as Error).message = `${(err as Error).message} [Col ${index}]`;
      throw err;
    }
  }

  return doc;
}

export function parseValue(
  value: string,
  type: CSVParsableFieldType
): CSVValue {
  if (type === 'int') {
    if (isNaN(+value)) {
      throw new Error(`"${value}" is not a number`);
    }

    return new Int32(value);
  }

  if (type === 'long') {
    if (isNaN(+value)) {
      throw new Error(`"${value}" is not a number`);
    }

    return new Long(value);
  }

  if (type === 'double') {
    if (isNaN(+value)) {
      throw new Error(`"${value}" is not a number`);
    }

    return new Double(parseFloat(value));
  }

  if (type === 'boolean') {
    // only using '1' and '0' when explicitly parsing, not when detecting so that those are left as ints
    if (TRUTHY_STRINGS.includes(value) || value === '1') {
      return true;
    }

    if (FALSY_STRINGS.includes(value) || value === '0') {
      return false;
    }

    return Boolean(value);
  }

  if (type === 'date') {
    let date;
    if (ISO_DATE.test(value)) {
      // iso string
      date = new Date(value);
    } else {
      // fall back to assuming it is an int64 value
      // NOTE: this won't be detected as date, so the user can only get here by
      // explicitly selecting date
      date = new Date(+value);
    }

    if (date.toString() === 'Invalid Date') {
      throw new Error(`"${value}" is not a date`);
    }

    return date;
  }

  if (type === 'null') {
    // At the time of writing the only way to get here is if the user selects
    // mixed and it detects the type as null. Null is not an option in the
    // dropdown.
    return null;
  }

  // The rest (other than the string fallback at the bottom) can't be detected
  // at the the time of writing, so the user will have to explicitly select it
  // from the dropdown.

  if (type === 'objectId') {
    // NOTE: this can throw
    return new ObjectId(value);
  }

  if (type === 'binData') {
    return new Binary(Buffer.from(value), Binary.SUBTYPE_DEFAULT);
  }

  if (type === 'uuid') {
    // NOTE: this can throw
    return new UUID(value);
  }

  if (type === 'md5') {
    return new Binary(Buffer.from(value), Binary.SUBTYPE_MD5);
  }

  if (type === 'timestamp') {
    if (isNaN(+value)) {
      throw new Error(`"${value}" is not a number`);
    }

    return Timestamp.fromString(value, 10);
  }

  if (type === 'decimal') {
    // NOTE: this can throw
    return Decimal128.fromString(value);
  }

  if (type === 'regex') {
    return new BSONRegExp(value);
  }

  // By default leave it as a string
  return value;
}

export function parseHeaderName(value: string): PathPart[] {
  const parts: PathPart[] = [];

  let previousType: 'field' | 'index' = 'field';
  let type: 'field' | 'index' = 'field';
  let snippet: string[] = [];

  for (const char of value) {
    if (type === 'field') {
      if (char === '[') {
        // this snippet length check is for:
        // 1. nested arrays (because closing an array defaults to type field)
        // 2. top-level array paths like [0].foo
        if (snippet.length) {
          parts.push({ type: 'field', name: snippet.join('') });
        } else if (previousType === 'field') {
          // this supports the edge case where the field name is a blank string
          // at the top level that is the name of an array field.
          parts.push({ type: 'field', name: '' });
        }
        previousType = type;
        type = 'index';
        snippet = [];
        continue;
      }
      if (char === '.') {
        if (snippet.length) {
          // this snippet length check helps with arrays of objects like
          // array[2].foo. closing the array defaults to type field and then
          // immediately afterwards we encounter a .
          parts.push({ type: 'field', name: snippet.join('') });
        } else if (previousType === 'field') {
          // this supports the edge case where the field name is a blank string
          // inside an object or a blank string at the top level that is the
          // name of an object.field.
          parts.push({ type: 'field', name: '' });
        }
        snippet = [];
        continue;
      }
    } else {
      if (char === ']') {
        const index = +snippet.join('');
        if (isNaN(index)) {
          throw new Error(`"${snippet.join('')}" is not a number`);
        }
        parts.push({ type: 'index', index });
        previousType = type;
        type = 'field';
        snippet = [];
        continue;
      }
    }
    snippet.push(char);
  }

  if (snippet.length) {
    if (type === 'field') {
      // in the most common case the path ends with an object field
      parts.push({ type: 'field', name: snippet.join('') });
    }
    if (type === 'index') {
      // shouldn't be possible unless the path is broken in a way where it ends
      // after [ but before ].
      const index = +snippet.join('');
      if (isNaN(index)) {
        throw new Error(`"${snippet.join('')}" is not a number`);
      }
      parts.push({ type: 'index', index });
    }
  } else if (
    parts.length === 0 ||
    (value.length > 0 && value[value.length - 1] === '.')
  ) {
    // this supports the edge case where the field name is a blank string (either
    // the whole field is a blank string or the last object field was a blank
    // string)
    parts.push({ type: 'field', name: '' });
  }

  return parts;
}

export type ErrorJSON = {
  name: string;
  message: string;
  index?: number;
  code?: string | number;
  op?: any;
  errorInfo?: Document;
  /*
  e.index = index;
  e.code = code;
  e.op = op;
  e.errInfo = errInfo;
  // https://www.mongodb.com/docs/manual/reference/method/BulkWriteResult/#mongodb-data-BulkWriteResult.writeErrors
  e.name = index && op ? 'WriteError' : 'WriteConcernError';
*/
};

export function errorToJSON(error: any): ErrorJSON {
  const obj: ErrorJSON = {
    name: error.name,
    message: error.message,
  };

  for (const key of ['index', 'code', 'op', 'errorInfo'] as const) {
    if (error[key] !== undefined) {
      obj[key] = error[key];
    }
  }

  return obj;
}
