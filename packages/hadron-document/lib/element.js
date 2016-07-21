'use strict';

const EventEmitter = require('events');
const keys = require('lodash.keys');
const isObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const includes = require('lodash.includes');
const Iterator = require('./iterator');
const ObjectGenerator = require('./object-generator');
const TypeChecker = require('hadron-type-checker');
const uuid = require('node-uuid');

/**
 * The event constant.
 */
const Events = {
  'Added': 'Element::Added',
  'Edited': 'Element::Edited',
  'Removed': 'Element::Removed',
  'Reverted': 'Element::Reverted'
};

/**
 * Id field constant.
 */
const ID = '_id';

/**
 * Types that are not editable.
 */
const UNEDITABLE_TYPES = [
  'ObjectID',
  'Binary',
  'Code',
  'MinKey',
  'MaxKey',
  'Timestamp'
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
 * Represents an element in a document.
 */
class Element extends EventEmitter {

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

    if (this._isExpandable(value)) {
      this.elements = this._generateElements(value);
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
    } else {
      this.currentValue = value;
    }
    this._bubbleUp(Events.Edited);
  }

  /**
   * Go to the next edit.
   *
   * Will check if the value is either { or [ and take appropriate action.
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
   * Rename the element.
   *
   * @param {String} key - The new key.
   */
  rename(key) {
    this.currentKey = key;
    this._bubbleUp(Events.Edited);
  }

  /**
   * Generate the javascript object for this element.
   *
   * @returns {Object} The javascript object.
   */
  generateObject() {
    if (this.currentValue) {
      return this.currentValue;
    }
    if (this.currentType === 'Array') {
      return ObjectGenerator.generateArray(this.elements);
    }
    return ObjectGenerator.generate(this.elements);
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
    this._bubbleUp(Events.Added);
    return newElement;
  }

  /**
   * Add a new element to this element.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertEnd(key, value) {
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
    return this.insertEnd('', '');
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
   * the key or value changed.
   *
   * @returns {Boolean} If the element is edited.
   */
  isEdited() {
    return (this.key !== this.currentKey || this.value !== this.currentValue) &&
      !this.isAdded();
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
   * Determine if the key is editable.
   *
   * @returns {Boolean} If the key is editable.
   */
  isKeyEditable() {
    return this.isAdded() || (this.currentKey !== ID);
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
      this.parent.elements.remove(this);
      this.parent.emit(Events.Removed);
      this.parent = null;
    } else {
      if (this.currentValue === null && this.value !== null) {
        this.elements = null;
      } else {
        this._removeAddedElements();
      }
      this.currentKey = this.key;
      this.currentValue = this.value;
      this.currentType = this.type;
      this.removed = false;
    }
    this._bubbleUp(Events.Reverted);
  }

  /**
   * Fire and bubble up the event.
   *
   * @param {Event} evt - The event.
   */
  _bubbleUp(evt) {
    this.emit(evt);
    var element = this.parent;
    if (element) {
      if (element.isRoot()) {
        element.emit(evt);
      } else {
        element._bubbleUp(evt);
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
   */
  _generateElements(object) {
    var elements = new LinkedList(); // eslint-disable-line no-use-before-define
    for (let key of keys(object)) {
      elements.insertEnd(this._key(key), object[key], this.added, this);
    }
    return elements;
  }

  /**
   * Get the key for the element.
   */
  _key(key) {
    return this.currentType === 'Array' ? '' : key;
  }

  /**
   * Add a new element to the parent.
   */
  _next() {
    if (this._isElementEmpty(this.nextElement)) {
      this.parent.elements.remove(this.nextElement);
      this.parent.emit(Events.Removed);
    } else if (this._isElementEmpty(this)) {
      this.parent.elements.remove(this);
      this.parent.emit(Events.Removed);
    } else {
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
    var element = this.firstElement;
    for (var i = 0; i < index; i++) {
      if (!element) {
        return null;
      }
      element = element.nextElement;
    }
    return element;
  }

  /**
   * Instantiate the new doubly linked list.
   */
  constructor() {
    this.firstElement = null;
    this.lastElement = null;
    this.size = 0;
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
    var newElement = new Element(key, value, added, parent, element, element.nextElement);
    if (element.nextElement) {
      element.nextElement.previousElement = newElement;
    } else {
      this.lastElement = newElement;
    }
    element.nextElement = newElement;
    this.size += 1;
    return newElement;
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
    var newElement = new Element(key, value, added, parent, element.previousElement, element);
    if (element.previousElement) {
      element.previousElement.nextElement = newElement;
    } else {
      this.firstElement = newElement;
    }
    element.previousElement = newElement;
    this.size += 1;
    return newElement;
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
    if (!this.firstElement) {
      var element = new Element(key, value, added, parent, null, null);
      this.firstElement = this.lastElement = element;
      this.size += 1;
      return element;
    }
    return this.insertBefore(this.firstElement, key, value, added, parent);
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

  /**
   * Get an iterator for the list.
   *
   * @returns {Iterator} The iterator.
   */
  [Symbol.iterator]() {
    return new Iterator(this.firstElement);
  }

  /**
   * Remove the element from the list.
   *
   * @param {Element} element - The element to remove.
   *
   * @returns {DoublyLinkedList} The list with the element removed.
   */
  remove(element) {
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
    this.size -= 1;
    return this;
  }
}

module.exports = Element;
module.exports.LinkedList = LinkedList;
module.exports.Events = Events;
