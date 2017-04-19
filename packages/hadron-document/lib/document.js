'use strict';

const EventEmitter = require('events');
const keys = require('lodash.keys');
const Element = require('./element');
const LinkedList = Element.LinkedList;
const ObjectGenerator = require('./object-generator');

/**
 * The event constant.
 */
const Events = {
  'Cancel': 'Document::Cancel'
};

/**
 * The id field.
 */
const ID = '_id';

/**
 * Represents a document.
 */
class Document extends EventEmitter {

  /**
   * Send cancel event.
   */
  cancel() {
    for (let element of this.elements) {
      element.cancel();
    }
    this.emit(Events.Cancel);
  }

  /**
   * Create the new document from the provided object.
   *
   * @param {Object} doc - The document.
   */
  constructor(doc, cloned) {
    super();
    this.doc = doc;
    this.cloned = cloned || false;
    this.isUpdatable = true;
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
   * Get the _id value for the document.
   *
   * @returns {Object} The id.
   */
  getId() {
    for (let element of this.elements) {
      if (element.currentKey === ID) {
        return element.currentValue;
      }
    }
    return null;
  }

  /**
   * Insert a placeholder element at the end of the document.
   *
   * @returns {Element} The placeholder element.
   */
  insertPlaceholder() {
    return this.insertEnd('', '');
  }

  /**
   * Add a new element to this document.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertEnd(key, value) {
    var newElement = this.elements.insertEnd(key, value, true, this);
    this.emit(Element.Events.Added);
    return newElement;
  }

  /**
   * Insert an element after the provided element.
   *
   * @param {Element} element - The element to insert after.
   * @param {String} key - The key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertAfter(element, key, value) {
    var newElement = this.elements.insertAfter(element, key, value, true, this);
    this.emit(Element.Events.Added);
    return newElement;
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
    for (let element of this.elements) {
      if (element.isModified()) {
        return true;
      }
    }
    return false;
  }

  /**
   * A document is never removed
   *
   * @returns {false} Always false.
   */
  isRemoved() {
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
   * Handle the next element in the document.
   */
  next() {
    const lastElement = this.elements.lastElement;
    if (lastElement && lastElement.isAdded()) {
      if (lastElement.isBlank()) {
        lastElement.remove();
      } else {
        this.insertPlaceholder();
      }
    } else {
      this.insertPlaceholder();
    }
  }

  /**
   * Generates a sequence of elements.
   *
   * @returns {Array} The elements.
   */
  _generateElements() {
    const elements = new LinkedList();
    for (let key of keys(this.doc)) {
      elements.insertEnd(key, this.doc[key], this.cloned, this);
    }
    return elements;
  }
}

module.exports = Document;
module.exports.Events = Events;
