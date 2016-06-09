'use strict';

const keys = require('lodash.keys');
const map = require('lodash.map');
const isObject = require('lodash.isobject');

/**
 * Represents an element in a document.
 */
class Element {

  /**
   * Get the absolute key, ie (contact.emails.work) for the element.
   *
   * @returns {String} The absolute key.
   */
  get absoluteKey() {
    return this.parentElement ? `${this.parentElement.absoluteKey}.${this.key}` : this.key;
  }

  /**
   * Create the element.
   *
   * @param {String} key - The key.
   * @param {Object} value - The value.
   * @param {Element} parentElement - The parent element.
   */
  constructor(key, value, parentElement) {
    this.key = key;
    this.currentKey = key;
    this.parentElement = parentElement;

    if (isObject(value)) {
      this.value = this._sequence(value);
    } else {
      this.value = value;
      this.currentValue = value;
    }
  }

  /**
   * Generates a sequence of child elements.
   *
   * @param {Object} object - The object to generate from.
   *
   * @returns {Array} The elements.
   */
  _sequence(object) {
    return map(keys(object), (key) => {
      return new Element(key, object[key], this);
    });
  }
}

module.exports = Element;
