'use strict';

const keys = require('lodash.keys');
const map = require('lodash.map');
const Element = require('./element');

/**
 * Represents a document.
 */
class Document {

  /**
   * Add a new element to this document.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  add(key, value) {
    var newElement = new Element(key, value, true, this);
    this.elements.push(newElement);
    return newElement;
  }


  /**
   * Create the new document from the provided object.
   *
   * @param {Object} doc - The document.
   */
  constructor(doc) {
    this.doc = doc;
    this.elements = this._generateElements();
  }

  isAdded() {
    return false;
  }

  /**
   * The document object is always the root object.
   *
   * @returns {true} Always true.
   */
  isRoot() {
    return true;
  }

  /**
   * Generates a sequence of elements.
   *
   * @returns {Array} The elements.
   */
  _generateElements() {
    return map(keys(this.doc), (key) => {
      return new Element(key, this.doc[key], false, this);
    });
  }
}

module.exports = Document;
