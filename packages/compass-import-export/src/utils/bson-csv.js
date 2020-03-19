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

const BOOLEAN_TRUE = ['1', 'true', 'TRUE'];
const BOOLEAN_FALSE = ['0', 'false', 'FALSE', 'null', '', 'NULL'];

export default {
  String: {
    fromString: function(s) {
      return '' + s;
    }
  },
  Number: {
    fromString: function(s) {
      s = '' + s;
      if (s.includes('.')) {
        return parseFloat(s);
      }
      return parseInt(s, 10);
    }
  },
  Boolean: {
    fromString: function(s) {
      if (BOOLEAN_TRUE.includes(s)) {
        return true;
      }

      if (BOOLEAN_FALSE.includes(s)) {
        return false;
      }

      return Boolean(s);
    }
  },
  Date: {
    fromString: function(s) {
      return new Date('' + s);
    }
  },
  ObjectId: {
    fromString: function(s) {
      if (s instanceof bson.ObjectId) {
        // EJSON being imported
        return s;
      }
      return new bson.ObjectId(s);
    }
  },
  Long: {
    fromString: function(s) {
      return bson.Long.fromString(s);
    }
  },
  RegExpr: {
    fromString: function(s) {
      // TODO: lucas: detect any specified regex options later.
      //
      // if (s.startsWith('/')) {
      //   var regexRegex = '/(.*)/([imxlsu]+)$'
      //   var [pattern, options];
      //   return new bson.BSONRegExp(pattern, options);
      // }
      return new bson.BSONRegExp(s);
    }
  },
  Binary: {
    fromString: function(s) {
      return new bson.Binary(s, bson.Binary.SUBTYPE_DEFAULT);
    }
  },
  UUID: {
    fromString: function(s) {
      return new bson.Binary(s, bson.Binary.SUBTYPE_UUID);
    }
  },
  MD5: {
    fromString: function(s) {
      return new bson.Binary(s, bson.Binary.SUBTYPE_MD5);
    }
  },
  Timestamp: {
    fromString: function(s) {
      return bson.Timestamp.fromString(s);
    }
  },
  Double: {
    fromString: function(s) {
      return new bson.Double(s);
    }
  },
  Int32: {
    fromString: function(s) {
      return parseInt(s, 10);
    }
  },
  Decimal128: {
    fromString: function(s) {
      return bson.Decimal128.fromString(s);
    }
  }
};

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
  ['[object Undefined]', 'Undefined']
]);

export function detectType(value) {
  const l = Object.prototype.toString.call(value);
  const t = TYPE_FOR_TO_STRING.get(l);
  return t;
}

export function getTypeDescriptorForValue(value) {
  const t = detectType(value);
  const _bsontype = t === 'Object' && value._bsontype;
  return {
    type: _bsontype ? _bsontype : t,
    isBSON: !!_bsontype
  };
}

/**
 * flat.flatten()
 * HT https://github.com/hughsk/flat/blob/master/index.js
 * @param {Object} doc
 * @returns {Object}
 */
export const serialize = function(doc) {
  const delimiter = '.';
  const output = {};
  const maxDepth = 1000;

  function step(object, prev, currentDepth = 1) {
    Object.keys(object).forEach(function(key) {
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

      // BSON values
      if (isBSON) {
        if (type === 'BSONRegExp') {
          /**
           * TODO (lucas) Upstream to `bson` as `BSONRegExp` toString()
           * returns `'[object Object]'` today.
           */
          output[newKey] = `/${value.pattern}/${value.options}`;
        } else {
          output[newKey] = value.toString();
        }
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
export const valueToString = function(value) {
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
