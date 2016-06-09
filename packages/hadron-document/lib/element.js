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
   * @returns {String} The absolute path.
   */
  get absolutePath() {
    return this.parentElement ? `${this.parentElement.absolutePath}.${this.key}` : this.key;
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
    this.removed = false;

    if (isObject(value)) {
      this.elements = this._generateElements(value);
    } else {
      this.value = value;
      this.currentValue = value;
    }
  }

  /**
   * Edit the element.
   *
   * @param {String} key - The new key.
   * @param {Object} value - The new value.
   */
  edit(key, value) {
    this.currentKey = key;
    this.currentValue = value;
  }

  /**
   * Determine if the element is edited - returns true if
   * the key or value changed.
   *
   * @returns {Boolean} If the element is edited.
   */
  isEdited() {
    return this.key !== this.currentKey || this.value !== this.currentValue;
  }

  /**
   * Is the element flagged for removal?
   *
   * @returns {Boolean} If the element is flagged for removal.
   */
  isRemoved() {
    return this.removed;
  }

  /**
   * Flag the element for removal.
   */
  remove() {
    this.revert();
    this.removed = true;
  }

  /**
   * Revert the changes to the element.
   */
  revert() {
    this.currentKey = this.key;
    this.currentValue = this.value;
    this.removed = false;
  }

  /**
   * Generates a sequence of child elements.
   *
   * @param {Object} object - The object to generate from.
   *
   * @returns {Array} The elements.
   */
  _generateElements(object) {
    return map(keys(object), (key) => {
      return new Element(key, object[key], this);
    });
  }
}

module.exports = Element;
