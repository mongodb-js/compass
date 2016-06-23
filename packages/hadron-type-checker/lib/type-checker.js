'use strict';

const isPlainObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const isString = require('lodash.isstring');
const has = require('lodash.has');
const find = require('lodash.find');
const toNumber = require('lodash.tonumber');
const toString = require('lodash.tostring');
const bson = require('bson');
const MinKey = bson.MinKey;
const MaxKey = bson.MaxKey;

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
  return Date.parse(object);
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

function toObject(object) {
  if (isPlainObject(object)) {
    return object;
  }
  return {};
}

function toArray(object) {
  if (isArray(object)) {
    return object;
  }
  return [ object ];
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
  'String': toString,
  'Object': toObject,
  'Array': toArray
}

class Test {
  constructor(tester, types) {
    this.tester = tester;
    this.types = types;
  }
};

class DateCheck {
  test(string) {
    var date = Date.parse(string)
    return date ? true : false;
  }
}

/**
 * The various string tests.
 */
const STRING_TESTS = [
  new Test(/^$/, [ 'String', 'Null', 'Undefined', 'MinKey', 'MaxKey', 'Object', 'Array'  ]),
  new Test(/^-?\d+$/, [ 'String', 'Number', 'Object', 'Array' ]),
  new Test(/^-?(\d*\.)?\d+$/, [ 'String', 'Number', 'Object', 'Array' ]),
  new Test(/^(null)$/, [ 'String', 'Null', 'Object', 'Array' ]),
  new Test(/^(undefined)$/, [ 'String', 'Undefined', 'Object', 'Array' ]),
  new Test(/^(true|false)$/, [ 'String', 'Boolean', 'Object', 'Array' ]),
  new Test(/^\/(.*)\/$/, [ 'String', 'BSONRegExp', 'Object', 'Array' ]),
  new Test(new DateCheck(), [ 'String', 'Date', 'Object', 'Array' ])
];

/**
 * Checks the types of objects and returns them as readable strings.
 */
class TypeChecker {

  /**
   * Cast the provided object to the desired type.
   *
   * @param {Object} object - The object to cast.
   * @param {String} type - The type.
   *
   * @returns {Object} The cast object.
   */
  cast(object, type) {
    var caster = CASTERS[type];
    var result = object;
    if (caster) {
      result = caster(object);
    }
    return result === '[object Object]' ? '' : result;
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

  /**
   * Get a list of types the object can be cast to.
   *
   * @param {Object} - The object.
   *
   * @returns {Array} The available types.
   */
  castableTypes(object) {
    if (isString(object)) {
      return this._stringTypes(object);
    } else {
      return [ this.type(object), 'String', 'Object', 'Array' ];
    }
  }

  _stringTypes(string) {
    var passing = find(STRING_TESTS, (test) => {
      return test.tester.test(string);
    });
    return passing ? passing.types : [ 'String', 'Object', 'Array' ];
  }
}

module.exports = new TypeChecker();
