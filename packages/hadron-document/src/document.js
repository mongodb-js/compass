'use strict';

const EventEmitter = require('eventemitter3');
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
    // Cancel will remove elements from iterator, clone it before iterating
    // otherwise we will skip items
    for (let element of Array.from(this.elements)) {
      element.cancel();
    }
    this.emit(Events.Cancel);
  }

  /**
   * Create the new document from the provided object.
   *
   * @param {Object} doc - The document.
   * @param {boolean} cloned - If it is a cloned document.
   */
  constructor(doc, cloned) {
    super();
    this.doc = doc;
    this.cloned = cloned || false;
    this.isUpdatable = true;
    this.elements = this._generateElements();
    this.type = 'Document';
    this.currentType = 'Document';
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
   * Generate the javascript object with the original elements in this document.
   *
   * @returns {Object} The original javascript object.
   */
  generateOriginalObject() {
    return ObjectGenerator.generateOriginal(this.elements);
  }

  /**
   * Generate the `query` and `updateDoc` to be used in an update operation
   * where the update only succeeds when the changed document's elements have
   * not been changed in the background.
   *
   * @param {Object} alwaysIncludeKeys - An object whose keys are used as keys
   *     that are always included in the generated query.
   *
   * @returns {Object} An object containing the `query` and `updateDoc` to be
   * used in an update operation.
   */
  generateUpdateUnlessChangedInBackgroundQuery(
    alwaysIncludeKeys = null
  ) {
    // Build a query that will find the document to update only if it has the
    // values of elements that were changed with their original value.
    // This query won't find the document if an updated element's value isn't
    // the same value as it was when it was originally loaded.
    const originalFieldsThatWillBeUpdated = this.getOriginalKeysAndValuesForFieldsThatWereUpdated(
      alwaysIncludeKeys
    );
    const query = {
      _id: this.getId(),
      ...originalFieldsThatWillBeUpdated
    };

    // Build the update document to be used in an update operation with `$set`
    // and `$unset` reflecting the changes that have occured in the document.
    const setUpdateObject = this.getSetUpdateForDocumentChanges();
    const unsetUpdateObject = this.getUnsetUpdateForDocumentChanges();
    const updateDoc = { };
    if (setUpdateObject && Object.keys(setUpdateObject).length > 0) {
      updateDoc.$set = setUpdateObject;
    }
    if (unsetUpdateObject && Object.keys(unsetUpdateObject).length > 0) {
      updateDoc.$unset = unsetUpdateObject;
    }

    return {
      query,
      updateDoc
    };
  }

  /**
   * Get an element by its key.
   *
   * @param {String} key
   *
   * @returns {Element} The element.
   */
  get(key) {
    return this.elements.get(key);
  }

  /**
   * Get an element by a series of segment names.
   *
   * @param {Array} path - The series of fieldnames. Cannot be empty.
   *
   * @returns {Element} The element.
   */
  getChild(path) {
    if (!path) {
      return undefined;
    }
    let element = (this.currentType === 'Array') ? this.elements.at(path[0]) : this.elements.get(path[0]);
    let i = 1;
    while (i < path.length) {
      if (element === undefined) {
        return undefined;
      }
      element = element.currentType === 'Array' ? element.at(path[i]) : element.get(path[i]);
      i++;
    }
    return element;
  }

  /**
   * Get the _id value for the document.
   *
   * @returns {Object} The id.
   */
  getId() {
    const element = this.get(ID);
    return element ? element.generateObject() : null;
  }

  /**
   * Generate the query javascript object reflecting the elements that
   * were updated in this document. The values of this object are the original
   * values, this can be used when querying for an update to see if the original
   * document was changed in the background while it was being updated elsewhere.
   *
   * @param {Object} alwaysIncludeKeys - An object whose keys are used as keys
   *     that are always included in the generated query.
   *
   * @returns {Object} The javascript object.
   */
  getOriginalKeysAndValuesForFieldsThatWereUpdated(
    alwaysIncludeKeys = null
  ) {
    const object = {};

    if (this.elements) {
      for (const element of this.elements) {
        if ((element.isModified() && !element.isAdded()) ||
            (alwaysIncludeKeys && element.key in alwaysIncludeKeys)) {
          // Using `.key` instead of `.currentKey` to ensure we look at
          // the original field's value.
          object[element.key] = element.generateOriginalObject();
        }
        if (element.isAdded() && element.currentKey !== '') {
          // When a new field is added, check if that field
          // was already added in the background.
          object[element.currentKey] = { $exists: false };
        }
      }
    }

    return object;
  }

  /**
   * Generate the query javascript object reflecting the elements that
   * are specified by the keys listed in `keys`. The values of this object are
   * the original values, this can be used when querying for an update based
   * on multiple criteria.
   *
   * @param {Object} keys - An object whose keys are used as keys
   *     that are included in the generated query.
   *
   * @returns {Object} The javascript object.
   */
  getOriginalKeysAndValuesForSpecifiedKeys(keys) {
    const object = {};

    if (this.elements) {
      for (const element of this.elements) {
        if (element.key in keys) {
          // Using `.key` instead of `.currentKey` to ensure we look at
          // the original field's value.
          object[element.key] = element.generateOriginalObject();
        }
      }
    }

    return object;
  }

  /**
   * Generate an $set javascript object, that can be used in update operations to
   * set the changes which have occured in the document since it was loaded.
   *
   * @returns {Object} The javascript update object.
  **/
  getSetUpdateForDocumentChanges() {
    const object = {};

    if (this.elements) {
      for (const element of this.elements) {
        if (
          !element.isRemoved()
          && element.currentKey !== ''
          && element.isModified()
        ) {
          // Include the full modified element.
          // We don't individually set nested fields because we can't guarantee a
          // path to the element using '.' dot notation will update
          // the correct field, because field names can contain dots as of 3.6.
          // When a nested field has been altered (changed/added/removed) it is
          // set at the top level field. This means we overwrite possible
          // background changes that occur within sub documents.
          object[element.currentKey] = element.generateObject();
        }
      }
    }
    return object;
  }

  /**
   * Get the _id value as a string. Required if _id is not always an ObjectId.
   *
   * @returns {String} The string id.
   */
  getStringId() {
    const element = this.get(ID);
    if (!element) {
      return null;
    } else if (element.currentType === 'Array' || element.currentType === 'Object') {
      return JSON.stringify(element.generateObject());
    }
    return '' + element.value;
  }

  /**
   * Generate an $unset javascript object, that can be used in update
   * operations, with the removals from the document.
   *
   * @returns {Object} The javascript update object.
  **/
  getUnsetUpdateForDocumentChanges() {
    const object = {};

    if (this.elements) {
      for (const element of this.elements) {
        if (!element.isAdded() && element.isRemoved() && element.key !== '') {
          object[element.key] = true;
        }
        if (!element.isAdded() && element.isRenamed() && element.key !== '') {
          // Remove the original field when an element is renamed.
          object[element.key] = true;
        }
      }
    }
    return object;
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
    newElement._bubbleUp(Element.Events.Added, newElement, this);
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
    newElement._bubbleUp(Element.Events.Added, newElement, this);
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
    this.elements.flush();
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
    return new LinkedList(this, this.doc);
  }
}

module.exports = Document;
module.exports.Events = Events;
