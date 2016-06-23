'use strict';

const EventEmitter = require('events');
const keys = require('lodash.keys');
const map = require('lodash.map');
const isObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const some = require('lodash.some');
const removeValues = require('lodash.remove');
const includes = require('lodash.includes');
const indexOf = require('lodash.indexof');
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

const CURLY = '{';

const BRACKET = '[';

/**
 * Represents an element in a document.
 */
class Element extends EventEmitter {

  /**
   * Add a new element to this element.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  add(key, value) {
    var newElement = new Element(key, value, true, this);
    this.elements.push(newElement);
    this._bubbleUp(Events.Added);
    return newElement;
  }

  /**
   * Get the absolute key, ie (contact.emails.work) for the element.
   *
   * @returns {String} The absolute path.
   */
  get absolutePath() {
    return !this.parentElement.isRoot() ? `${this.parentElement.absolutePath}.${this.key}` : this.key;
  }

  /**
   * Create the element.
   *
   * @param {String} key - The key.
   * @param {Object} value - The value.
   * @param {Boolean} added - Is the element a new 'addition'?
   * @param {Element} parentElement - The parent element.
   */
  constructor(key, value, added, parentElement) {
    super();
    this.uuid = uuid.v4();
    this.key = key;
    this.currentKey = key;
    this.parentElement = parentElement;
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
    return this._addToParent();
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
   * Is the element a newly added element?
   *
   * @returns {Boolean} If the element is newly added.
   */
  isAdded() {
    return this.added || (this.parentElement && this.parentElement.isAdded());
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
    return indexOf(this.parentElement.elements, this) ===
      (this.parentElement.elements.length - 1);
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
    return this.currentKey !== ID;
  }

  /**
   * Determine if the element is modified at all.
   *
   * @returns {Boolean} If the element is modified.
   */
  isModified() {
    if (this.elements) {
      return some(this.elements, (element) => {
        return element.isModified();
      });
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
      removeValues(this.parentElement.elements, (element) => {
        return element === this;
      });
      this.parentElement.emit(Events.Removed);
      this.parentElement = null;
    } else {
      this.currentKey = this.key;
      this.currentValue = this.value;
      this._removeAddedElements();
      this.removed = false;
    }
    this._bubbleUp(Events.Reverted);
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
    return map(keys(object), (key) => {
      return new Element(key, object[key], this.added, this);
    });
  }

  /**
   * Removes the added elements from the element.
   */
  _removeAddedElements() {
    removeValues(this.elements, (element) => {
      return element.isAdded();
    });
  }

  /**
   * Fire and bubble up the event.
   *
   * @param {Event} evt - The event.
   */
  _bubbleUp(evt) {
    this.emit(evt);
    var element = this.parentElement;
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
    this.add('', '');
  }

  /**
   * Convert to an empty array.
   */
  _convertToEmptyArray() {
    this.edit([]);
    this.add('0', '');
  }

  /**
   * Add a new element to the parent.
   */
  _addToParent() {
    if (this.isLast()) {
      if (this.parentElement.currentType === 'Array') {
        var length = this.parentElement.elements.length;
        this.parentElement.add(String(length), '');
      } else {
        this.parentElement.add('', '');
      }
    }
  }
}

module.exports = Element;
module.exports.Events = Events;
