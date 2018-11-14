'use strict';

const EventEmitter = require('eventemitter3');
const keys = require('lodash.keys');
const isObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const isEqual = require('lodash.isequal');
const isString = require('lodash.isstring');
const includes = require('lodash.includes');
const ObjectGenerator = require('./object-generator');
const TypeChecker = require('hadron-type-checker');
const uuid = require('uuid');

const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';

/**
 * The event constant.
 */
const Events = {
  'Added': 'Element::Added',
  'Edited': 'Element::Edited',
  'Removed': 'Element::Removed',
  'Reverted': 'Element::Reverted',
  'Converted': 'Element::Converted',
  'Invalid': 'Element::Invalid',
  'Valid': 'Element::Valid'
};

/**
 * Id field constant.
 */
const ID = '_id';

/**
 * Types that are not editable.
 */
const UNEDITABLE_TYPES = [
  'Binary',
  'Code',
  'MinKey',
  'MaxKey',
  'Timestamp',
  'BSONRegExp',
  'Undefined',
  'Null'
];

/**
 * Curly brace constant.
 */
const CURLY = '{';

/**
 * Bracket constant.
 */
const BRACKET = '[';

/**
 * Regex to match an array or object string.
 */
const ARRAY_OR_OBJECT = /^(\[|\{)(.+)(\]|\})$/;

/**
 * Represents an element in a document.
 */
class Element extends EventEmitter {

  /**
   * Bulk edit the element. Can accept JSON strings.
   *
   * @param {String} value - The JSON string value.
   */
  bulkEdit(value) {
    if (value.match(ARRAY_OR_OBJECT)) {
      this.edit(JSON.parse(value));
      this._bubbleUp(Events.Converted);
    } else {
      this.edit(value);
    }
  }

  /**
   * Cancel any modifications to the element.
   */
  cancel() {
    if (this.elements) {
      for (let element of this.elements) {
        element.cancel();
      }
    }
    if (this.isModified()) {
      this.revert();
    }
  }

  /**
   * Create the element.
   *
   * @param {String} key - The key.
   * @param {Object} value - The value.
   * @param {Boolean} added - Is the element a new 'addition'?
   * @param {Element} parent - The parent element.
   * @param {Element} previousElement - The previous element in the list.
   * @param {Element} nextElement - The next element in the list.
   */
  constructor(key, value, added, parent, previousElement, nextElement) {
    super();
    this.uuid = uuid.v4();
    this.key = key;
    this.currentKey = key;
    this.parent = parent;
    this.previousElement = previousElement;
    this.nextElement = nextElement;
    this.added = added;
    this.removed = false;
    this.type = TypeChecker.type(value);
    this.currentType = this.type;
    this.setValid();

    if (this._isExpandable(value)) {
      this.elements = this._generateElements(value);
      this.originalExpandableValue = value;
    } else {
      this.value = value;
      this.currentValue = value;
    }
  }

  /**
   * Edit the element.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    this.currentType = TypeChecker.type(value);
    if (this._isExpandable(value) && !this._isExpandable(this.currentValue)) {
      this.currentValue = null;
      this.elements = this._generateElements(value);
    } else if (!this._isExpandable(value) && this.elements) {
      this.currentValue = value;
      this.elements = undefined;
    } else {
      this.currentValue = value;
    }
    this.setValid();
    this._bubbleUp(Events.Edited);
  }

  /**
   * Get an element by its key.
   *
   * @param {String} key - The key name.
   *
   * @returns {Element} The element.
   */
  get(key) {
    return this.elements ? this.elements.get(key) : undefined;
  }

  /**
   * Get an element by its index.
   *
   * @param {Number} i - The index.
   *
   * @returns {Element} The element.
   */
  at(i) {
    return this.elements ? this.elements.at(i) : undefined;
  }

  /**
   * Go to the next edit.
   *
   * Will check if the value is either { or [ and take appropriate action.
   *
   *  @returns {Element} The next element.
   */
  next() {
    if (this.currentValue === CURLY) {
      return this._convertToEmptyObject();
    } else if (this.currentValue === BRACKET) {
      return this._convertToEmptyArray();
    }
    return this._next();
  }

  /**
   * Rename the element. Update the parent's mapping if available.
   *
   * @param {String} key - The new key.
   */
  rename(key) {
    if (this.parent !== undefined) {
      const elm = this.parent.elements._map[this.currentKey];
      delete this.parent.elements._map[this.currentKey];
      this.parent.elements._map[key] = elm;
    }

    this.currentKey = key;
    this._bubbleUp(Events.Edited);
  }

  /**
   * Generate the javascript object for this element.
   *
   * @returns {Object} The javascript object.
   */
  generateObject() {
    if (this.currentType === 'Array') {
      return ObjectGenerator.generateArray(this.elements);
    }
    if (this.elements) {
      return ObjectGenerator.generate(this.elements);
    }
    return this.currentValue;
  }

  /**
   * Insert an element after the provided element. If this element is an array,
   * then ignore the key specified by the caller and use the correct index.
   * Update the keys of the rest of the elements in the LinkedList.
   *
   * @param {Element} element - The element to insert after.
   * @param {String} key - The key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertAfter(element, key, value) {
    if (this.currentType === 'Array') {
      if (element.currentKey === '') {
        this.elements.handleEmptyKeys(element);
      }
      key = element.currentKey + 1;
    }
    var newElement = this.elements.insertAfter(element, key, value, true, this);
    if (this.currentType === 'Array') {
      this.elements.updateKeys(newElement, 1);
    }
    this._bubbleUp(Events.Added);
    return newElement;
  }

  /**
   * Add a new element to this element.
   *
   * @param {String | Number} key - The element key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertEnd(key, value) {
    if (this.currentType === 'Array') {
      key = 0;
      if (this.elements.lastElement) {
        if (this.elements.lastElement.currentKey === '') {
          this.elements.handleEmptyKeys(this.elements.lastElement);
        }
        key = this.elements.lastElement.currentKey + 1;
      }
    }
    var newElement = this.elements.insertEnd(key, value, true, this);
    this._bubbleUp(Events.Added);
    return newElement;
  }

  /**
   * Insert a placeholder element at the end of the element.
   *
   * @returns {Element} The placeholder element.
   */
  insertPlaceholder() {
    var newElement = this.elements.insertEnd('', '', true, this);
    this._bubbleUp(Events.Added);
    return newElement;
  }

  /**
   * Is the element a newly added element?
   *
   * @returns {Boolean} If the element is newly added.
   */
  isAdded() {
    return this.added || (this.parent && this.parent.isAdded());
  }

  /**
   * Is the element blank?
   *
   * @returns {Boolean} If the element is blank.
   */
  isBlank() {
    return this.currentKey === '' && this.currentValue === '';
  }

  /**
   * Does the element have a valid value for the current type?
   *
   * @returns {Boolean} If the value is valid.
   */
  isCurrentTypeValid() {
    return this.currentTypeValid;
  }

  /**
   * Set the element as valid.
   */
  setValid() {
    this.currentTypeValid = true;
    this.invalidTypeMessage = undefined;
    this._bubbleUp(Events.Valid, this.uuid);
  }

  /**
   * Set the element as invalid.
   *
   * @param {Object} value - The value.
   * @param {String} newType - The new type.
   * @param {String} message - The error message.
   */
  setInvalid(value, newType, message) {
    this.currentValue = value;
    this.currentType = newType;
    this.currentTypeValid = false;
    this.invalidTypeMessage = message;
    this._bubbleUp(Events.Invalid, this.uuid);
  }

  /**
   * Determine if the key is a duplicate.
   *
   * @param {String} value - The value to check.
   *
   * @returns {Boolean} If the key is a duplicate.
   */
  isDuplicateKey(value) {
    if (value === this.currentKey) {
      return false;
    }
    for (let element of this.parent.elements) {
      if (element.currentKey === value) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determine if the element is edited - returns true if
   * the key or value changed. Does not count array values whose keys have
   * changed as edited.
   *
   * @returns {Boolean} If the element is edited.
   */
  isEdited() {
    let keyChanged = false;
    if (!this.parent || this.parent.isRoot() || this.parent.currentType === 'Object') {
      keyChanged = (this.key !== this.currentKey);
    }
    return (keyChanged ||
      !this._valuesEqual() ||
      this.type !== this.currentType) &&
      !this.isAdded();
  }

  /**
   * Check for value equality.

   * @returns {Boolean} If the value is equal.
   */
  _valuesEqual() {
    if (this.currentType === 'Date' && isString(this.currentValue)) {
      return isEqual(this.value, new Date(this.currentValue));
    } else if (this.currentType === 'ObjectId' && isString(this.currentValue)) {
      return this._isObjectIdEqual();
    }
    return isEqual(this.value, this.currentValue);
  }

  _isObjectIdEqual() {
    try {
      return this.value.toHexString() === this.currentValue;
    } catch (_) {
      return false;
    }
  }

  /**
   * Is the element the last in the elements.
   *
   * @returns {Boolean} If the element is last.
   */
  isLast() {
    return this.parent.elements.lastElement === this;
  }

  /**
   * Can changes to the elemnt be reverted?
   *
   * @returns {Boolean} If the element can be reverted.
   */
  isRevertable() {
    return this.isEdited() || this.isRemoved();
  }

  /**
   * Can the element be removed?
   *
   * @returns {Boolean} If the element can be removed.
   */
  isRemovable() {
    return !this.parent.isRemoved();
  }

  /**
   * Can no action be taken on the element?
   *
   * @returns {Boolean} If no action can be taken.
   */
  isNotActionable() {
    return (this.key === ID && !this.isAdded()) || !this.isRemovable();
  }

  /**
   * Determine if the value is editable.
   *
   * @returns {Boolean} If the value is editable.
   */
  isValueEditable() {
    return this.isKeyEditable() && !includes(UNEDITABLE_TYPES, this.currentType);
  }

  /**
   * Determine if the key of the parent element is editable.
   *
   * @returns {Boolean} If the parent's key is editable.
   */
  isParentEditable() {
    if (this.parent && !this.parent.isRoot()) {
      return this.parent.isKeyEditable();
    }
    return true;
  }

  /**
   * Determine if the key is editable.
   *
   * @returns {Boolean} If the key is editable.
   */
  isKeyEditable() {
    return this.isParentEditable() && (this.isAdded() || (this.currentKey !== ID));
  }

  /**
   * Determine if the element is modified at all.
   *
   * @returns {Boolean} If the element is modified.
   */
  isModified() {
    if (this.elements) {
      for (let element of this.elements) {
        if (element.isModified()) {
          return true;
        }
      }
    }
    return this.isAdded() || this.isEdited() || this.isRemoved();
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
   * Elements themselves are not the root.
   *
   * @returns {false} Always false.
   */
  isRoot() {
    return false;
  }

  /**
   * Flag the element for removal.
   */
  remove() {
    this.revert();
    this.removed = true;
    this._bubbleUp(Events.Removed);
  }

  /**
   * Revert the changes to the element.
   */
  revert() {
    if (this.isAdded()) {
      if (this.parent && this.parent.currentType === 'Array') {
        this.parent.elements.updateKeys(this, -1);
      }
      this.parent.elements.remove(this);
      this.parent.emit(Events.Removed);
      this.parent = null;
    } else {
      if (this.originalExpandableValue) {
        this.elements = this._generateElements(this.originalExpandableValue);
        this.currentValue = undefined;
      } else {
        if (this.currentValue === null && this.value !== null) {
          this.elements = null;
        } else {
          this._removeAddedElements();
        }
        this.currentValue = this.value;
      }
      this.currentKey = this.key;
      this.currentType = this.type;
      this.removed = false;
    }
    this.setValid();
    this._bubbleUp(Events.Reverted);
  }

  /**
   * Fire and bubble up the event.
   *
   * @param {Event} evt - The event.
   * @param {*} data - Optional.
   */
  _bubbleUp(evt, data) {
    this.emit(evt, data);
    var element = this.parent;
    if (element) {
      if (element.isRoot()) {
        element.emit(evt, data);
      } else {
        element._bubbleUp(evt, data);
      }
    }
  }

  /**
   * Convert this element to an empty object.
   */
  _convertToEmptyObject() {
    this.edit({});
    this.insertPlaceholder();
  }

  /**
   * Convert to an empty array.
   */
  _convertToEmptyArray() {
    this.edit([]);
    this.insertPlaceholder();
  }

  /**
   * Is the element empty?
   *
   * @param {Element} element - The element to check.
   *
   * @returns {Boolean} If the element is empty.
   */
  _isElementEmpty(element) {
    return element && element.isAdded() && element.isBlank();
  }

  /**
   * Check if the value is expandable.
   *
   * @param {Object} value - The value to check.
   *
   * @returns {Boolean} If the value is expandable.
   */
  _isExpandable(value) {
    return isObject(value) || isArray(value);
  }

  /**
   * Generates a sequence of child elements.
   *
   * @param {Object} object - The object to generate from.
   *
   * @returns {Array} The elements.
   *
   * @todo: This needs to be lazy as well.
   */
  _generateElements(object) {
    var elements = new LinkedList(); // eslint-disable-line no-use-before-define
    let index = 0;
    for (let key of keys(object)) {
      elements.insertEnd(this._key(key, index), object[key], this.added, this);
      index ++;
    }
    return elements;
  }

  /**
   * Get the key for the element.
   *
   * @param {String} key
   * @param {Number} index
   *
   * @returns {String|Number} The index if the type is an array, or the key.
   */
  _key(key, index) {
    return this.currentType === 'Array' ? index : key;
  }

  /**
   * Add a new element to the parent.
   */
  _next() {
    if (!this._isElementEmpty(this.nextElement) && !this._isElementEmpty(this)) {
      this.parent.insertAfter(this, '', '');
    }
  }

  /**
   * Removes the added elements from the element.
   */
  _removeAddedElements() {
    if (this.elements) {
      for (let element of this.elements) {
        if (element.isAdded()) {
          this.elements.remove(element);
        }
      }
    }
  }
}

/**
 * Represents a doubly linked list.
 */
class LinkedList {

  /**
   * Get the element at the provided index.
   *
   * @param {Integer} index - The index.
   *
   * @returns {Element} The matching element.
   */
  at(index) {
    this.flush();
    if (!Number.isInteger(index)) {
      return undefined;
    }

    var element = this.firstElement;
    for (var i = 0; i < index; i++) {
      if (!element) {
        return undefined;
      }
      element = element.nextElement;
    }
    return element === null ? undefined : element;
  }

  get(key) {
    this.flush();
    return this._map[key];
  }

  /**
   * Instantiate the new doubly linked list.
   */
  constructor(doc, originalDoc) {
    this.firstElement = null;
    this.lastElement = null;
    this.doc = doc;
    this.originalDoc = originalDoc;
    this.keys = keys(this.originalDoc);
    this.size = this.keys.length;
    this.loaded = 0;
    this._map = {};
  }

  /**
   * Insert data after the provided element.
   *
   * @param {Element} element - The element to insert after.
   * @param {String} key - The element key.
   * @param {Object} value - The element value.
   * @param {Boolean} added - If the element is new.
   * @param {Object} parent - The parent.
   *
   * @returns {Element} The inserted element.
   */
  insertAfter(element, key, value, added, parent) {
    this.flush();
    return this._insertAfter(element, key, value, added, parent);
  }

  /**
   * Update the currentKey of each element if array elements.
   *
   * @param {Element} element - The element to insert after.
   * @param {Number} add - 1 if adding a new element, -1 if removing.
   */
  updateKeys(element, add) {
    this.flush();
    while (element.nextElement) {
      element.nextElement.currentKey += add;
      element = element.nextElement;
    }
  }

  /**
   * If an element is added after a placeholder, convert that placeholder
   * into an empty element with the correct key.
   *
   * @param {Element} element - The placeholder element.
   */
  handleEmptyKeys(element) {
    if (element.currentKey === '') {
      let e = element;
      while (e.currentKey === '') {
        if (!e.previousElement) {
          e.currentKey = 0;
          break;
        } else {
          e = e.previousElement;
        }
      }
      while (e.nextElement) {
        e.nextElement.currentKey = e.currentKey + 1;
        e = e.nextElement;
      }
    }
  }

  /**
   * Insert data before the provided element.
   *
   * @param {Element} element - The element to insert before.
   * @param {String} key - The element key.
   * @param {Object} value - The element value.
   * @param {Boolean} added - If the element is new.
   * @param {Object} parent - The parent.
   *
   * @returns {Element} The inserted element.
   */
  insertBefore(element, key, value, added, parent) {
    this.flush();
    return this._insertBefore(element, key, value, added, parent);
  }

  /**
   * Insert data at the beginning of the list.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The element value.
   * @param {Boolean} added - If the element is new.
   * @param {Object} parent - The parent.
   *
   * @returns {Element} The data element.
   */
  insertBeginning(key, value, added, parent) {
    this.flush();
    return this._insertBeginning(key, value, added, parent);
  }

  /**
   * Insert data at the end of the list.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The element value.
   * @param {Boolean} added - If the element is new.
   * @param {Object} parent - The parent.
   *
   * @returns {Element} The data element.
   */
  insertEnd(key, value, added, parent) {
    if (!this.lastElement) {
      return this.insertBeginning(key, value, added, parent);
    }
    return this.insertAfter(this.lastElement, key, value, added, parent);
  }

  flush() {
    if (this.loaded < this.size) {
      for (let element of this) {
        if (element && element.elements) {
          element.elements.flush();
        }
      }
    }
  }

  /**
   * Get an iterator for the list.
   *
   * @returns {Iterator} The iterator.
   */
  [Symbol.iterator]() {
    let currentElement;
    let index = 0;
    return {
      next: () => {
        if (this._needsLazyLoad(index)) {
          const key = this.keys[index];
          index += 1;
          currentElement = this._lazyInsertEnd(key);
          return { value: currentElement };
        } else if (this._needsStandardIteration(index)) {
          if (currentElement) {
            currentElement = currentElement.nextElement;
          } else {
            currentElement = this.firstElement;
          }
          if (currentElement) {
            index += 1;
            return { value: currentElement };
          }
          return { done: true };
        }
        return { done: true };
      }
    };
  }

  _needsLazyLoad(index) {
    return (index === 0 && this.loaded === 0 && this.size > 0) ||
      (this.loaded <= index && index < this.size);
  }

  _needsStandardIteration(index) {
    return (this.loaded > 0 && index < this.loaded && index < this.size);
  }

  /**
   * Insert on the end of the list lazily.
   *
   * @param {String} key - The key.
   *
   * @returns {Element} The inserted element.
   */
  _lazyInsertEnd(key) {
    this.size -= 1;
    return this._insertEnd(key, this.originalDoc[key], this.doc.cloned, this.doc);
  }

  _insertEnd(key, value, added, parent) {
    if (!this.lastElement) {
      return this._insertBeginning(key, value, added, parent);
    }
    return this._insertAfter(this.lastElement, key, value, added, parent);
  }

  _insertBefore(element, key, value, added, parent) {
    var newElement = new Element(key, value, added, parent, element.previousElement, element);
    if (element.previousElement) {
      element.previousElement.nextElement = newElement;
    } else {
      this.firstElement = newElement;
    }
    element.previousElement = newElement;
    this._map[newElement.key] = newElement;
    this.size += 1;
    this.loaded += 1;
    return newElement;
  }

  _insertBeginning(key, value, added, parent) {
    if (!this.firstElement) {
      var element = new Element(key, value, added, parent, null, null);
      this.firstElement = this.lastElement = element;
      this.size += 1;
      this.loaded += 1;
      this._map[element.key] = element;
      return element;
    }
    const newElement = this.insertBefore(this.firstElement, key, value, added, parent);
    this._map[newElement.key] = newElement;
    return newElement;
  }

  _insertAfter(element, key, value, added, parent) {
    var newElement = new Element(key, value, added, parent, element, element.nextElement);
    if (element.nextElement) {
      element.nextElement.previousElement = newElement;
    } else {
      this.lastElement = newElement;
    }
    element.nextElement = newElement;
    this._map[newElement.key] = newElement;
    this.size += 1;
    this.loaded += 1;
    return newElement;
  }

  /**
   * Remove the element from the list.
   *
   * @param {Element} element - The element to remove.
   *
   * @returns {DoublyLinkedList} The list with the element removed.
   */
  remove(element) {
    this.flush();
    if (element.previousElement) {
      element.previousElement.nextElement = element.nextElement;
    } else {
      this.firstElement = element.nextElement;
    }
    if (element.nextElement) {
      element.nextElement.previousElement = element.previousElement;
    } else {
      this.lastElement = element.previousElement;
    }
    element.nextElement = element.previousElement = null;
    delete this._map[element.currentKey];
    this.size -= 1;
    this.loaded -= 1;
    return this;
  }
}

module.exports = Element;
module.exports.LinkedList = LinkedList;
module.exports.Events = Events;
module.exports.DATE_FORMAT = DATE_FORMAT;
