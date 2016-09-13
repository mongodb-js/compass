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
    if (elements) {
      var object = {};
      for (let element of elements) {
        if (!element.isRemoved() && element.currentKey !== '') {
          object[element.currentKey] = element.generateObject();
        }
      }
      return object;
    }
    return elements;
  }

  /**
   * Generate an array from the elements.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Array} The array.
   */
  generateArray(elements) {
    if (elements) {
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
    return elements;
  }
}

module.exports = new ObjectGenerator();
