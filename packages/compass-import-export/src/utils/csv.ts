import _ from 'lodash';
import assert from 'assert';
import type { Document } from 'mongodb';
import { Double, Int32, Long } from 'bson';

export const supportedDelimiters = [',', '\t', ';', ' '];
export type Delimiter = typeof supportedDelimiters[number];

// the subset of bson types that we can detect
export type CSVFieldType =
  | 'int'
  | 'long'
  | 'double'
  | 'boolean'
  | 'date'
  | 'string'
  | 'null'
  | 'undefined';

export type IncludedFields = Record<string, CSVFieldType | 'mixed'>;

export type CSVValue = Double | Int32 | Long | Date | boolean | string | null;

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

export function detectFieldType(
  value: string,
  ignoreEmptyStrings?: boolean
): CSVFieldType {
  // mongoexport and existing compass style nulls
  if (value === '' || value === undefined) {
    return ignoreEmptyStrings ? 'undefined' : 'string';
  } else if (value === 'Null') {
    return 'null';
  } else if (value === 'true' || value === 'TRUE') {
    return 'boolean';
  } else if (value === 'false' || value === 'FALSE') {
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
      _.isObject(parent) && !(parent as Document)._bsontype,
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

export function parseValue(value: string, type: CSVFieldType): CSVValue {
  if (type === 'int') {
    return new Int32(value);
  }

  if (type === 'long') {
    return new Long(value);
  }

  if (type === 'double') {
    return new Double(parseFloat(value));
  }

  if (type === 'boolean') {
    if (value === 'true' || value === 'TRUE') {
      return true;
    }
    return false;
  }

  if (type === 'date') {
    if (ISO_DATE.test(value)) {
      // iso string
      return new Date(value);
    }
    // fall back to assuming it is an int64 value
    return new Date(+value);
  }

  if (type === 'null') {
    // This will only match an explicit 'Null' in the CSV file because empty
    // strings are handled separately already.
    return null;
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
        // 1. nested arrays (because closing an array default to type field)
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
        parts.push({ type: 'index', index: parseInt(snippet.join(''), 10) });
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
      parts.push({ type: 'index', index: parseInt(snippet.join(''), 10) });
    }
  } else if (
    parts.length === 0 ||
    (value.length > 0 && value[value.length - 1] === '.')
  ) {
    // this supports the edge case where te field name is a blank string (either
    // the whole field is a blank string or the last object field was a blank
    // string)
    parts.push({ type: 'field', name: '' });
  }

  return parts;
}
