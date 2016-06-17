'use strict';

const isPlainObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const isString = require('lodash.isstring');
const has = require('lodash.has');
const find = require('lodash.find');
const toNumber = require('lodash.tonumber');

/**
 * The object string.
 */
const OBJECT = 'Object';

/**
 * The array type string.
 */
const ARRAY = 'Array';

/**
 * The bson type field.
 */
const BSON_TYPE = '_bsontype';

/**
 * The match regex.
 */
const MATCH = /\[object (\w+)\]/;

function toDate(object) {
  return new Date(object);
}

function toMinKey(object) {
  return new MinKey();
}

function toMaxKey(object) {
  return new MaxKey();
}

function toUndefined(object) {
  return undefined;
}

function toNull(object) {
  return null;
}

function toBoolean(object) {
  if (object.toLowerCase() === 'true') {
    return true;
  }
  return false;
}

function toTimestamp(object) {
  return new Timestamp(object);
}

/**
 * The functions to cast to a type.
 */
const CASTERS = {
  'Number': toNumber,
  'Date': toDate,
  'MinKey': toMinKey,
  'MaxKey': toMaxKey,
  'Undefined': toUndefined,
  'Null': toNull,
  'Boolean': toBoolean,
  'Timestamp': toTimestamp,
}

class Test {
  constructor(regex, types) {
    this.regex = regex;
    this.types = types;
  }
};

/**
 * The various string tests.
 */
const STRING_TESTS = [
  new Test(/^$/, [ 'String', 'MinKey', 'MaxKey'  ]),
  new Test(/^-?\d+$/, [ 'String', 'Number' ]),
  new Test(/^-?(\d*\.)?\d+$/, [ 'String', 'Number' ]),
  new Test(/^(null)$/, [ 'String', 'Null' ]),
  new Test(/^(undefined)$/, [ 'String', 'Undefined' ]),
  new Test(/^(true|false)$/, [ 'String', 'Boolean' ])
];

/**
 * Checks the types of objects and returns them as readable strings.
 */
class TypeChecker {

  cast(object, type) {
    var caster = CASTERS[type];
    if (caster) {
      return caster(object);
    }
    return object;
  }

  /**
   * Get the type for the object.
   *
   * @param {Object} object - The object.
   *
   * @returns {String} The object type.
   */
  type(object) {
    if (isPlainObject(object)) {
      return OBJECT;
    }
    if (isArray(object)) {
      return ARRAY;
    }
    if (has(object, BSON_TYPE)) {
      return object._bsontype;
    }
    return Object.prototype.toString.call(object).replace(MATCH, '$1');
  }

  castableTypes(object) {
    if (isString(object)) {
      return this._stringTypes(object);
    } else {
      return [ this.type(object), 'String' ];
    }
  }

  _stringTypes(string) {
    var passing = find(STRING_TESTS, (test) => {
      return test.regex.test(string);
    });
    return passing ? passing.types : [ 'String' ];
  }
}

module.exports = new TypeChecker();
