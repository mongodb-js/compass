'use strict';

const _ = require('lodash');

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

/**
 * Checks the types of objects and returns them as readable strings.
 */
class TypeChecker {

  /**
   * Get the type for the object.
   *
   * @param {Object} object - The object.
   *
   * @returns {String} The object type.
   */
  type(object) {
    if (_.isPlainObject(object)) {
      return OBJECT;
    }
    if (_.isArray(object)) {
      return ARRAY;
    }
    if (_.has(object, BSON_TYPE)) {
      return object._bsontype;
    }
    return Object.prototype.toString.call(object).replace(MATCH, '$1');
  }
}

module.exports = new TypeChecker();
