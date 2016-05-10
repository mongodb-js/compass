'use strict';

const _ = require('lodash');

const OBJECT = 'Object';
const ARRAY = 'Array';
const BSON_TYPE = '_bsontype';
const MATCH = /\[object (\w+)\]/;

class TypeChecker {

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
