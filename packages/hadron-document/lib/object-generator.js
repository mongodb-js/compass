'use strict';

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
    for (let element of elements) {
      if (!element.isRemoved()) {
        object[element.currentKey] = element.generateObject();
      }
    }
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
    var array = [];
    for (let element of elements) {
      if (!element.isRemoved()) {
        if (element.elements) {
          array.push(element.generateObject());
        } else {
          array.push(element.currentValue);
        }
      }
    }
    return array;
  }
}

module.exports = new ObjectGenerator();
