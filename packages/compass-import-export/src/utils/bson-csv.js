/**
 * Unlike extended JSON, there is no library/spec for
 * serializing and deserializing CSV values.
 *
 * Basically if:
 * 1. All bson type defs had a consistent `.fromString()` * method
 * 2. Castings/detection used by fromString() today were exposed
 * (e.g. JS Number float -> bson.Double).
 */

/**
 * TODO: lucas: Incorporate serialization. Start with what mongoimport
 * does: https://github.com/mongodb/mongo-tools-common/blob/master/json/csv_format.go
 */

/**
 * TODO: lucas: If we want to support types via CSV headers
 * for compatibility with mongoimport, that all happens in:
 * https://github.com/mongodb/mongo-tools/blob/master/mongoimport/typed_fields.go
 *
 * And https://www.npmjs.com/package/flat#transformkey can be used to prototype.
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
      return parseFloat(s);
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
      return new Date(s);
    }
  },
  ObjectId: {
    fromString: function(s) {
      // eslint-disable-next-line new-cap
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
      return new bson.Timestamp.fromString(s);
    }
  },
  Double: {
    fromString: function(s) {
      return new bson.Double(parseFloat(s));
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

export function detectType(value) {
  if (value === undefined) {
    return 'Undefined';
  }
  if (value === null) {
    return 'Null';
  }
  return /function ([A-Za-z]+)/.exec(value.constructor.toString())[1];
}
