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
   * Generate a javascript object from the elements with their original keys
   * and values. This can be used in a query with an update to
   * ensure the values on the document to edit are still up to date.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Object} The javascript object.
   */
  generateOriginal(elements) {
    if (elements) {
      var object = {};
      for (let element of elements) {
        if (!element.isAdded()) {
          object[element.key] = element.generateOriginalObject();
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

  /**
   * Generate an array from the elements using their original values.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Array} The array.
   */
  generateOriginalArray(elements) {
    if (elements) {
      var array = [];
      for (let element of elements) {
        if (element.originalExpandableValue) {
          array.push(element.generateOriginalObject());
        } else if (!element.isAdded()) {
          array.push(element.value);
        }
      }
      return array;
    }
    return elements;
  }
}

module.exports = new ObjectGenerator();
