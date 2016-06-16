'use strict';

const EventEmitter = require('events');
const keys = require('lodash.keys');
const map = require('lodash.map');
const some = require('lodash.some');
const Element = require('./element');
const ObjectGenerator = require('./object-generator');

/**
 * Represents a document.
 */
class Document extends EventEmitter {

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
    this.emit(Element.Events.Added);
    return newElement;
  }

  /**
   * Create the new document from the provided object.
   *
   * @param {Object} doc - The document.
   */
  constructor(doc) {
    super();
    this.doc = doc;
    this.elements = this._generateElements();
  }

  /**
   * Generate the javascript object for this document.
   *
   * @returns {Object} The javascript object.
   */
  generateObject() {
    return ObjectGenerator.generate(this.elements);
  }

  /**
   * A document always exists, is never added.
   *
   * @returns {false} Always false.
   */
  isAdded() {
    return false;
  }

  /**
   * Determine if the element is modified at all.
   *
   * @returns {Boolean} If the element is modified.
   */
  isModified() {
    return some(this.elements, (element) => {
      return element.isModified();
    });
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
