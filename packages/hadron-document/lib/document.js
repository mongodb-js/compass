'use strict';

const keys = require('lodash.keys');
const map = require('lodash.map');
const Element = require('./element');

/**
 * Represents a document.
 */
class Document {

  /**
   * Create the new document from the provided object.
   *
   * @param {Object} doc - The document.
   */
  constructor(doc) {
    this.doc = doc;
    this.elements = this._generateElements();
  }

  /**
   * Generates a sequence of elements.
   *
   * @returns {Array} The elements.
   */
  _generateElements() {
    return map(keys(this.doc), (key) => {
      return new Element(key, this.doc[key]);
    });
  }
}

module.exports = Document;
