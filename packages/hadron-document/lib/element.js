'use strict';

const EventEmitter = require('events');
const keys = require('lodash.keys');
const map = require('lodash.map');
const isObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const some = require('lodash.some');
const removeValues = require('lodash.remove');
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
    this.emit(Events.Added);
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
    this.emit(Events.Edited);
  }

  /**
   * Rename the element.
   *
   * @param {String} key - The new key.
   */
  rename(key) {
    this.currentKey = key;
    this.emit(Events.Edited);
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
      return map(this.elements, (element) => {
        if (element.elements) {
          return element.generateObject();
        }
        return element.currentValue;
      });
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
    return (this.key !== this.currentKey || this.value !== this.currentValue) && !this.isAdded();
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
    this.emit(Events.Removed);
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
    this.emit(Events.Reverted);
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
      return new Element(key, object[key], false, this);
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
}

module.exports = Element;
module.exports.Events = Events;
