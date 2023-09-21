import _ from 'lodash';
import assert from 'assert';
import type { Document } from 'bson';
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
  EJSON,
  MinKey,
  MaxKey,
} from 'bson';

import type {
  Delimiter,
  Linebreak,
  PathPart,
  CSVDetectableFieldType,
  CSVParsableFieldType,
  IncludedFields,
  CSVValue,
  CSVFieldTypeInfo,
} from './csv-types';

export function formatCSVValue(
  value: string,
  {
    delimiter,
    escapeLinebreaks = false,
  }: {
    delimiter: Delimiter;
    escapeLinebreaks?: boolean;
  }
) {
  value = value.replace(/"/g, '""');

  if (escapeLinebreaks) {
    // This should only really be necessary for values that started out as
    // arbitrary strings. Usually our conversion to a string takes care of this.
    // ie. numbers are never going to have line breaks in them and
    // EJSON.stringify() takes care of it.
    // (Yes CSV has no standard way of escaping line breaks or anything other
    //  than double quotes.)
    value = value.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
  }

  if (value.indexOf(delimiter) !== -1 || value.indexOf('"') !== -1) {
    // Put quotes around a value if it contains the delimiter or an escaped
    // quote. This will also affect EJSON objects and arrays
    value = `"${value}"`;
  }

  return value;
}

export function formatCSVLine(
  values: string[],
  {
    delimiter,
    linebreak,
  }: {
    delimiter: Delimiter;
    linebreak: Linebreak;
  }
) {
  return `${values.join(delimiter)}${linebreak}`;
}

export function stringifyCSVValue(
  value: any,
  {
    delimiter,
  }: {
    delimiter: Delimiter;
  }
): string {
  if ([null, undefined].includes(value as null | undefined)) {
    return '';
  }

  const bsonType = value._bsontype;

  if (!bsonType) {
    // Even when parsing with relaxed: false string values remain strings
    if (typeof value === 'string') {
      return formatCSVValue(value, {
        delimiter,
        escapeLinebreaks: true,
      });
    }

    if (Object.prototype.toString.call(value) === '[object Date]') {
      return value.toISOString();
    }

    // When parsing with relaxed: false we won't see numbers here, but it is
    // good to keep it here so that this function works in both scenarios.
    if (['number', 'boolean'].includes(typeof value)) {
      return formatCSVValue(value.toString() as string, {
        delimiter,
      });
    }

    // Arrays and plain objects that somehow made it here plus unforeseen things
    // that don't have a _bsontype.
    return formatCSVValue(EJSON.stringify(value, { relaxed: false }), {
      delimiter,
    });
  }

  if (['Long', 'Int32', 'Double'].includes(bsonType as string)) {
    return value.toString();
  }

  if (value.toHexString) {
    // ObjectId and UUID both have toHexString() which does exactly what we want
    return value.toHexString();
  }

  if (bsonType === 'Binary') {
    // This should base64 encode the value which can't contain the delimiter,
    // line breaks or quotes
    return value.toJSON() as string;
  }

  if (bsonType === 'BSONRegExp') {
    const bsonregex = value as BSONRegExp;
    return formatCSVValue(`/${bsonregex.pattern}/${bsonregex.options}`, {
      delimiter,
    });
  }

  if (bsonType === 'Decimal128') {
    // This should turn it into a number string with exponent
    return value.toString();
  }

  if (bsonType === 'Timestamp') {
    // This should turn it into a number string
    return value.toString();
  }

  if (bsonType === 'MinKey') {
    // Same as mongoexport
    return '$MinKey';
  }

  if (bsonType === 'MaxKey') {
    // Same as mongoexport
    return '$MaxKey';
  }

  // BSONSymbol, Code, DBRef and whatever new types get added
  return formatCSVValue(EJSON.stringify(value, { relaxed: false }), {
    delimiter,
  });
}

export function csvHeaderNameToFieldName(name: string) {
  return name.replace(/\[\d+\]/g, '[]');
}

const MIN_INT = -2147483648;
const MAX_INT = 2147483647;
const MIN_LONG = BigInt('-9223372036854775808');
const MAX_LONG = BigInt('9223372036854775807');
// from papaparse: https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1024
const FLOAT_REGEX = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/;
// from papaparse: https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1025
const ISO_DATE_REGEX =
  /^((\d{4}-[01]\d-[0-3]\d[T ][0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/;
const DATEONLY_REGEX = /^\d{4}-[01]\d-[0-3]\d$/;
// a regular expression for detecting regular expressions
const REGEX_REGEX = /^\/.*\/\w*$/;
// from js-bson: https://github.com/mongodb/js-bson/blob/5b837a9e5019016529a83700f3ba3065d5e53e80/src/objectid.ts#L6
// this also supports mongoexport's format
const OBJECTID_REGEX = /^(ObjectId\()?([0-9a-fA-F]{24})\)?$/;
// from js-bson: https://github.com/mongodb/js-bson/blob/5b837a9e5019016529a83700f3ba3065d5e53e80/src/uuid_utils.ts#L5
const UUID_REGEX =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15})$/i;
const TRUTHY_STRINGS = ['t', 'true', 'TRUE', 'True'];
const FALSY_STRINGS = ['f', 'false', 'FALSE', 'False'];
const NULL_STRINGS = ['Null', 'NULL', 'null'];

const parenthesis = {
  '{': '}',
  '[': ']',
};

function isEJSON(value: string) {
  if (
    value.length &&
    ['{', '['].includes(value[0]) &&
    value[value.length - 1] === parenthesis[value[0] as '{' | '[']
  ) {
    try {
      JSON.parse(value);
    } catch (err) {
      return false;
    }
    return true;
  }

  return false;
}

export function detectCSVFieldType(
  value: string,
  name: string,
  ignoreEmptyStrings?: boolean
): CSVDetectableFieldType | 'undefined' {
  // for some types we can go further and also look at the field name
  if (name === '_id' && OBJECTID_REGEX.test(value)) {
    return 'objectId';
  }

  if (value === '') {
    return ignoreEmptyStrings ? 'undefined' : 'string';
  }

  if (isEJSON(value)) {
    return 'ejson';
  }

  if (NULL_STRINGS.includes(value)) {
    return 'null';
  }

  if (TRUTHY_STRINGS.includes(value)) {
    return 'boolean';
  }

  if (FALSY_STRINGS.includes(value)) {
    return 'boolean';
  }

  if (FLOAT_REGEX.test(value)) {
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
  }

  if (ISO_DATE_REGEX.test(value) || DATEONLY_REGEX.test(value)) {
    return 'date';
  }

  if (UUID_REGEX.test(value)) {
    return 'uuid';
  }

  if (REGEX_REGEX.test(value)) {
    return 'regex';
  }

  if (value === '$MinKey') {
    // support mongoexport's way of exporting minKey
    return 'minKey';
  }

  if (value === '$MaxKey') {
    // support mongoexport's way of exporting maxKey
    return 'maxKey';
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

export function overrideDetectedFieldType(fieldType: CSVParsableFieldType) {
  // We can detect regex, but we don't want to automatically select it due to
  // the fact that URL paths often look like regexes. It is still useful to
  // detect it, though, because then when the user manually selects regexp we
  // can still warn if all the values for that field don't look like regular
  // expressions.
  if (fieldType === 'regex') {
    return 'string';
  }

  return fieldType;
}

export function makeDocFromCSV(
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
      type = overrideDetectedFieldType(
        detectCSVFieldType(
          original,
          fieldName,
          ignoreEmptyStrings
        ) as CSVParsableFieldType
      );
    }
    if (type === 'number') {
      type = overrideDetectedFieldType(
        detectCSVFieldType(
          original,
          fieldName,
          ignoreEmptyStrings
        ) as CSVParsableFieldType
      );
      if (!['int', 'long', 'double'].includes(type)) {
        throw new Error(
          `"${original}" is not a number (found "${type}") [Col ${index}]`
        );
      }
    }

    const path = parsedHeader[name];

    try {
      const value = parseCSVValue(original, type);

      placeValue(doc, path, value, true);
    } catch (err: unknown) {
      // rethrow with the column index appended to aid debugging
      (err as Error).message = `${(err as Error).message} [Col ${index}]`;
      throw err;
    }
  }

  return doc;
}

export function parseCSVValue(
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
    // only using '1' and '0' when explicitly parsing, not when detecting so
    // that those are left as ints
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
    if (ISO_DATE_REGEX.test(value)) {
      // iso string
      date = new Date(value);
    } else if (!isNaN(+value)) {
      // if it is a number, assume it is an int64 value
      // NOTE: this won't be detected as date, so the user can only get here by
      // explicitly selecting date
      date = new Date(+value);
    } else {
      // As a last resort, maybe it is in the date-only format like "YYYY-MM-DD"
      // with no time part?
      date = new Date(value);
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
    if (NULL_STRINGS.includes(value)) {
      return null;
    } else {
      throw new Error(`"${value}" is not null`);
    }
  }

  if (type === 'uuid') {
    // NOTE: this can throw
    return new UUID(value);
  }

  if (type === 'regex') {
    const match = value.match(/^\/(.*)\/(.*)$/);
    if (!match) {
      throw new Error(`"${value}" is not a regular expression`);
    }
    return new BSONRegExp(match[1], match[2]);
  }

  if (type === 'minKey') {
    if (value === '$MinKey') {
      return new MinKey();
    } else {
      throw new Error(`"${value}" is not $MinKey`);
    }
  }

  if (type === 'maxKey') {
    if (value === '$MaxKey') {
      return new MaxKey();
    } else {
      throw new Error(`"${value}" is not $MaxKey`);
    }
  }

  if (type === 'ejson') {
    // This works for arrays or objects that got stringified by mongoexport and
    // also for the fallback exportCSV() has for types like symbol, javascript,
    // javascriptWithScope and dbref where we don't have a better way to turn
    // values into strings. Furthermore it also helps for the cases where
    // mongoexport uses EJSON stringify and we don't. ie. Timestamp.
    return EJSON.parse(value);
  }

  if (type === 'objectId') {
    const match = value.match(OBJECTID_REGEX);
    if (!match) {
      throw new Error(`"${value}" is not an ObjectId`);
    }
    return new ObjectId(match[2]);
  }

  // The rest (other than the string fallback at the bottom) can't be detected
  // at the the time of writing, so the user will have to explicitly select it
  // from the dropdown.

  if (type === 'binData') {
    return new Binary(Buffer.from(value, 'base64'), Binary.SUBTYPE_DEFAULT);
  }

  if (type === 'md5') {
    return new Binary(Buffer.from(value, 'base64'), Binary.SUBTYPE_MD5);
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

  // By default leave it as a string
  return value;
}

export function parseCSVHeaderName(value: string): PathPart[] {
  const parts: PathPart[] = [];

  let previousType: 'field' | 'index' = 'field';
  let ignoreBlankField = false;
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
          if (!ignoreBlankField) {
            parts.push({ type: 'field', name: '' });
          }
        }
        previousType = type;
        type = 'index';
        snippet = [];
        ignoreBlankField = false;
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
          if (!ignoreBlankField) {
            parts.push({ type: 'field', name: '' });
          }
        }
        snippet = [];
        ignoreBlankField = false;
        continue;
      }
    } else {
      if (char === ']') {
        const index = +snippet.join('');
        if (isNaN(index) || snippet.length === 0) {
          // what initially looked like an array actually wasn't, so either
          // append to the previous part field if there is one or add a new
          // one
          const namePart = `[${snippet.join('')}]`;
          if (parts.length && parts[parts.length - 1].type === 'field') {
            (parts[parts.length - 1] as { name: string }).name += namePart;
          } else {
            parts.push({ type: 'field', name: namePart });
          }
          previousType = 'field';
          // previousType is 'field' and snippet is blank but if the next
          // character is { or . then we don't want a blank field name to be
          // appended because the part we just added or appended is the field
          // name.
          ignoreBlankField = true;
          type = 'field';
          snippet = [];
          continue;
        }
        parts.push({ type: 'index', index });
        previousType = type;
        type = 'field';
        snippet = [];
        ignoreBlankField = false;
        continue;
      }
    }
    snippet.push(char);
    ignoreBlankField = false;
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
        const namePart = `[${snippet.join('')}`;
        if (parts.length && parts[parts.length - 1].type === 'field') {
          (parts[parts.length - 1] as { name: string }).name += namePart;
        } else {
          parts.push({ type: 'field', name: namePart });
        }
      } else {
        parts.push({ type: 'index', index });
      }
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

export function formatCSVHeaderName(path: PathPart[]): string {
  return path
    .map((part, index) => {
      if (part.type === 'field') {
        return `${index === 0 ? '' : '.'}${part.name}`;
      } else {
        return `[${part.index}]`;
      }
    })
    .join('');
}

const NUMBER_TYPES: CSVParsableFieldType[] = ['int', 'long', 'double'];

export function isCompatibleCSVFieldType(
  selectedType: CSVParsableFieldType,
  type: CSVParsableFieldType | 'undefined'
) {
  if (type === 'undefined') {
    // Blanks that are mixed in are always OK because they will be ignored
    // separately depending on the Ignore empty strings option. This does leave
    // the edge case where the entire column is always blank which has to be
    // handed separately.
    return true;
  }

  if (selectedType === 'string') {
    // we can leave anything as a string
    return true;
  }

  if (selectedType === 'mixed') {
    // anything can be processed as mixed
    return true;
  }

  if (selectedType === 'number') {
    // only number type can be a number
    return NUMBER_TYPES.includes(type);
  }

  if (selectedType === 'double') {
    // any number type can be a double
    return NUMBER_TYPES.includes(type);
  }

  if (selectedType === 'decimal') {
    // any number type can be made a decimal
    return NUMBER_TYPES.includes(type);
  }

  if (selectedType === 'long') {
    // only int32 and long can both be long
    return ['int', 'long'].includes(type);
  }

  if (selectedType === 'date') {
    // dates and longs can be dates
    if (['date', 'long'].includes(type)) {
      return true;
    }

    // Our date type detection isn't perfect and `new Date(someString)` can take
    // a surprising amount of stuff and kick out a date, so just allow users to
    // try their luck. The parsing code will check that it made some date, at
    // least.
    if (NUMBER_TYPES.includes(type) || type === 'string') {
      return true;
    }

    return false;
  }

  if (selectedType === 'timestamp') {
    // we can only parse longs as timestamps
    return type === 'long';
  }

  // The constructors for all these things can take various things (more than we
  // can detect), so just allow the user to try anything. It will produce parse
  // errors if things won't work anyway.
  if (['objectId', 'uuid', 'md5', 'binData'].includes(selectedType)) {
    return true;
  }

  // By default the type has to match what it detected. This should cover:
  // *  boolean, minKey, maxKey and null where we can only parse it to a boolean
  //    if it matches the strings used to detect
  // * ejson where we check if it parses as part of the detection
  // * regex where we check that we can parse it as part of detection
  return type === selectedType;
}

export function findBrokenCSVTypeExample(
  types: Record<CSVDetectableFieldType | 'undefined', CSVFieldTypeInfo>,
  selectedType: CSVParsableFieldType
) {
  for (const [type, info] of Object.entries(types) as [
    type: CSVParsableFieldType | 'undefined',
    info: CSVFieldTypeInfo
  ][]) {
    if (!isCompatibleCSVFieldType(selectedType, type)) {
      return info;
    }
  }
  return null;
}
