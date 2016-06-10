'use strict';

const each = require('lodash.foreach');

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
      object[element.currentKey] = element.generateObject();
    });
    return object;
  }
}

module.exports = new ObjectGenerator();
