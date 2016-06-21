'use strict';

const each = require('lodash.foreach');
const map = require('lodash.map');
const compact = require('lodash.compact');

/**
 * Generates javascript objects from elements.
 */
class ObjectGenerator {

  /**
   * Generate a javascript object from the elements.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Object} The javascript object.
   */
  generate(elements) {
    var object = {};
    each(elements, (element) => {
      if (!element.isRemoved()) {
        object[element.currentKey] = element.generateObject();
      }
    });
    return object;
  }

  /**
   * Generate an array from the elements.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Array} The array.
   */
  generateArray(elements) {
    return compact(map(elements, (element) => {
      if (element.isRemoved()) {
        return null;
      }
      if (element.elements) {
        return element.generateObject();
      }
      return element.currentValue;
    }));
  }
}

module.exports = new ObjectGenerator();
