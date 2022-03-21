/* eslint-disable no-use-before-define */
/* eslint-disable complexity */
/**
 * Unlike extended JSON, there is no library/spec for
 * serializing and deserializing CSV values.
 *
 * Basically if:
 * 1. All bson type defs had a consistent `.fromString()` * method
 * 2. Castings/detection used by fromString() today were exposed
 * (e.g. JS Number float -> bson.Double).
 *
 * Related: https://github.com/mongodb-js/hadron-type-checker/blob/master/src/type-checker.js
 */

/**
 * TODO: lucas: Other types (null, undefined, etc.) and formats
 * (see mongoimport typed headers) later. Could also include:
 * 1. [val 1, val2] -> array
 * 2. {foo: bar} => nested object
 * 3. etc.
 */
import bson from 'bson';
import { createDebug } from './logger';

const debug = createDebug('bson-csv');

const BOOLEAN_TRUE = ['1', 'true', 'TRUE', true];
const BOOLEAN_FALSE = ['0', 'false', 'FALSE', 'null', '', 'NULL', false];

const casters = {
  String: {
    fromString: function (s) {
      return '' + s;
    },
  },
  Number: {
    fromString: function (s) {
      s = '' + s;
      if (s.includes('.')) {
        return parseFloat(s);
      }
      return parseInt(s, 10);
    },
  },
  Boolean: {
    fromString: function (s) {
      if (BOOLEAN_TRUE.includes(s)) {
        return true;
      }

      if (BOOLEAN_FALSE.includes(s)) {
        return false;
      }

      return Boolean(s);
    },
  },
  Date: {
    fromString: function (s) {
      if (s instanceof Date) {
        return s;
      }
      return new Date('' + s);
    },
  },
  ObjectID: {
    fromString: function (s) {
      const { isBSON } = getTypeDescriptorForValue(s);
      if (isBSON) {
        // EJSON being imported
        return s;
      }
      return new bson.ObjectID(s);
    },
  },
  Long: {
    fromString: function (s) {
      if (s instanceof bson.Long) {
        // EJSON being imported
        return s;
      }
      return bson.Long.fromString(s);
    },
  },
  RegExpr: {
    fromString: function (s) {
      if (s instanceof bson.BSONRegExp) {
        // EJSON being imported
        return s;
      }
      // TODO: lucas: detect any specified regex options later.
      //
      // if (s.startsWith('/')) {
      //   var regexRegex = '/(.*)/([imxlsu]+)$'
      //   var [pattern, options];
      //   return new bson.BSONRegExp(pattern, options);
      // }
      return new bson.BSONRegExp(s);
    },
  },
  Binary: {
    fromString: function (s) {
      if (s instanceof bson.Binary) {
        return s;
      }
      return new bson.Binary(s, bson.Binary.SUBTYPE_DEFAULT);
    },
  },
  UUID: {
    fromString: function (s) {
      if (s instanceof bson.Binary) {
        return s;
      }
      return new bson.Binary(s, bson.Binary.SUBTYPE_UUID);
    },
  },
  MD5: {
    fromString: function (s) {
      if (s instanceof bson.Binary) {
        return s;
      }
      return new bson.Binary(s, bson.Binary.SUBTYPE_MD5);
    },
  },
  Timestamp: {
    fromString: function (s) {
      if (s instanceof bson.Timestamp) {
        return s;
      }
      return bson.Timestamp.fromString(s);
    },
  },
  Double: {
    fromString: function (s) {
      return new bson.Double(s);
    },
  },
  Int32: {
    fromString: function (s) {
      return parseInt(s, 10);
    },
  },
  Decimal128: {
    fromString: function (s) {
      return bson.Decimal128.fromString(s);
    },
  },
};

casters.BSONRegExp = casters.RegExpr;
export default casters;

/**
 * [`Object.prototype.toString.call(value)`, `string type name`]
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/toString#Using_toString_to_detect_object_class
 */
const TYPE_FOR_TO_STRING = new Map([
  ['[object Array]', 'Array'],
  ['[object Object]', 'Object'],
  ['[object String]', 'String'],
  ['[object Date]', 'Date'],
  ['[object Number]', 'Number'],
  ['[object Function]', 'Function'],
  ['[object RegExp]', 'RegExp'],
  ['[object Boolean]', 'Boolean'],
  ['[object Null]', 'Null'],
  ['[object Undefined]', 'Undefined'],
]);

export function getBSONTypeForValue(value) {
  const type = value && value._bsontype;
  if (type === 'ObjectId') {
    return 'ObjectID';
  }

  if (type) {
    return type;
  }
  return undefined;
}

export function detectType(value) {
  const bsonType = getBSONTypeForValue(value);
  if (bsonType) {
    return bsonType;
  }

  const o = Object.prototype.toString.call(value);
  const t = TYPE_FOR_TO_STRING.get(o);
  if (!t) {
    return getBSONTypeForValue(value);
  }
  return t;
}

export function getTypeDescriptorForValue(value) {
  const t = detectType(value);
  const _bsontype = getBSONTypeForValue(value);
  return {
    type: _bsontype ? _bsontype : t,
    isBSON: !!_bsontype,
  };
}

/**
 * flat.flatten()
 * HT https://github.com/hughsk/flat/blob/master/index.js
 * @param {Object} doc
 * @returns {Object}
 */
export const serialize = function (doc) {
  const delimiter = '.';
  const output = {};
  const maxDepth = 1000;

  function step(object, prev, currentDepth = 1) {
    Object.keys(object).forEach(function (key) {
      const value = object[key];
      const { type, isBSON } = getTypeDescriptorForValue(value);
      const newKey = prev ? prev + delimiter + key : key;

      /**
       * TODO: lucas: If we want to support types via CSV headers
       * for compatibility with mongoimport, update `newKey` to include
       * the magic suffix.
       * https://github.com/mongodb/mongo-tools/blob/master/mongoimport/typed_fields.go
       */
      /**
       * TODO: lucas: Standardize what mongoimport
       * does instead of hex string/EJSON: https://github.com/mongodb/mongo-tools-common/blob/master/json/csv_format.go
       */

      debug('serialize', { isBSON, type, value });
      // BSON values
      if (isBSON) {
        output[newKey] = valueToString(value);
        return;
      }

      // Embedded arrays
      if (type === 'Array') {
        output[newKey] = bson.EJSON.stringify(value, null, null);
        return;
      }

      if (type === 'Date') {
        output[newKey] = value.toISOString();
        return;
      }

      if (type === 'Boolean') {
        if (BOOLEAN_TRUE.includes(value)) {
          output[newKey] = 'true';
          return;
        }

        if (BOOLEAN_FALSE.includes(value)) {
          output[newKey] = 'false';
          return;
        }
      }

      // Embedded documents
      if (
        type === 'Object' &&
        Object.keys(value).length &&
        currentDepth < maxDepth
      ) {
        return step(value, newKey, currentDepth + 1);
      }

      // All other values
      output[newKey] = '' + value;
    });
  }
  step(doc);
  return output;
};

/**
 * TODO (lucas) Consolidate valueToString with dupe logic in serialize() later.
 */

export const valueToString = function (value) {
  const { type, isBSON } = getTypeDescriptorForValue(value);

  // BSON values
  if (isBSON) {
    if (type === 'BSONRegExp') {
      /**
       * TODO (lucas) Upstream to `bson` as `BSONRegExp` toString()
       * returns `'[object Object]'` today.
       */
      return `/${value.pattern}/${value.options}`;
    }
    if (type === 'ObjectID') {
      return value.toString('hex');
    }
    if (type === 'Binary') {
      return value.toString('base64');
    }
    return value.toString();
  }

  // Embedded arrays
  if (type === 'Array') {
    return bson.EJSON.stringify(value, null, null);
  }

  if (type === 'Date') {
    return value.toISOString();
  }

  // All other values
  return '' + value;
};
