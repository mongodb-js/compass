'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('eventemitter3');
var keys = require('lodash.keys');
var isObject = require('lodash.isplainobject');
var isArray = require('lodash.isarray');
var isEqual = require('lodash.isequal');
var isString = require('lodash.isstring');
var includes = require('lodash.includes');
var ObjectGenerator = require('./object-generator');
var TypeChecker = require('hadron-type-checker');
var uuid = require('uuid');

var DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';

/**
 * The event constant.
 */
var Events = {
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
var ID = '_id';

/**
 * Types that are not editable.
 */
var UNEDITABLE_TYPES = ['Binary', 'Code', 'MinKey', 'MaxKey', 'Timestamp', 'BSONRegExp', 'Undefined', 'Null'];

/**
 * Curly brace constant.
 */
var CURLY = '{';

/**
 * Bracket constant.
 */
var BRACKET = '[';

/**
 * Regex to match an array or object string.
 */
var ARRAY_OR_OBJECT = /^(\[|\{)(.+)(\]|\})$/;

/**
 * Represents an element in a document.
 */

var Element = function (_EventEmitter) {
  _inherits(Element, _EventEmitter);

  _createClass(Element, [{
    key: 'bulkEdit',


    /**
     * Bulk edit the element. Can accept JSON strings.
     *
     * @param {String} value - The JSON string value.
     */
    value: function bulkEdit(value) {
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

  }, {
    key: 'cancel',
    value: function cancel() {
      if (this.elements) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = this.elements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var element = _step.value;

            element.cancel();
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
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

  }]);

  function Element(key, value, added, parent, previousElement, nextElement) {
    _classCallCheck(this, Element);

    var _this = _possibleConstructorReturn(this, (Element.__proto__ || Object.getPrototypeOf(Element)).call(this));

    _this.uuid = uuid.v4();
    _this.key = key;
    _this.currentKey = key;
    _this.parent = parent;
    _this.previousElement = previousElement;
    _this.nextElement = nextElement;
    _this.added = added;
    _this.removed = false;
    _this.type = TypeChecker.type(value);
    _this.currentType = _this.type;
    _this.setValid();

    if (_this._isExpandable(value)) {
      _this.elements = _this._generateElements(value);
      _this.originalExpandableValue = value;
    } else {
      _this.value = value;
      _this.currentValue = value;
    }
    return _this;
  }

  /**
   * Edit the element.
   *
   * @param {Object} value - The new value.
   */


  _createClass(Element, [{
    key: 'edit',
    value: function edit(value) {
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

  }, {
    key: 'get',
    value: function get(key) {
      return this.elements ? this.elements.get(key) : undefined;
    }

    /**
     * Get an element by its index.
     *
     * @param {Number} i - The index.
     *
     * @returns {Element} The element.
     */

  }, {
    key: 'at',
    value: function at(i) {
      return this.elements ? this.elements.at(i) : undefined;
    }

    /**
     * Go to the next edit.
     *
     * Will check if the value is either { or [ and take appropriate action.
     *
     *  @returns {Element} The next element.
     */

  }, {
    key: 'next',
    value: function next() {
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

  }, {
    key: 'rename',
    value: function rename(key) {
      if (this.parent !== undefined) {
        var elm = this.parent.elements._map[this.currentKey];
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

  }, {
    key: 'generateObject',
    value: function generateObject() {
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

  }, {
    key: 'insertAfter',
    value: function insertAfter(element, key, value) {
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

  }, {
    key: 'insertEnd',
    value: function insertEnd(key, value) {
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

  }, {
    key: 'insertPlaceholder',
    value: function insertPlaceholder() {
      var newElement = this.elements.insertEnd('', '', true, this);
      this._bubbleUp(Events.Added);
      return newElement;
    }

    /**
     * Is the element a newly added element?
     *
     * @returns {Boolean} If the element is newly added.
     */

  }, {
    key: 'isAdded',
    value: function isAdded() {
      return this.added || this.parent && this.parent.isAdded();
    }

    /**
     * Is the element blank?
     *
     * @returns {Boolean} If the element is blank.
     */

  }, {
    key: 'isBlank',
    value: function isBlank() {
      return this.currentKey === '' && this.currentValue === '';
    }

    /**
     * Does the element have a valid value for the current type?
     *
     * @returns {Boolean} If the value is valid.
     */

  }, {
    key: 'isCurrentTypeValid',
    value: function isCurrentTypeValid() {
      return this.currentTypeValid;
    }

    /**
     * Set the element as valid.
     */

  }, {
    key: 'setValid',
    value: function setValid() {
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

  }, {
    key: 'setInvalid',
    value: function setInvalid(value, newType, message) {
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

  }, {
    key: 'isDuplicateKey',
    value: function isDuplicateKey(value) {
      if (value === this.currentKey) {
        return false;
      }
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.parent.elements[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var element = _step2.value;

          if (element.currentKey === value) {
            return true;
          }
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
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

  }, {
    key: 'isEdited',
    value: function isEdited() {
      var keyChanged = false;
      if (!this.parent || this.parent.isRoot() || this.parent.currentType === 'Object') {
        keyChanged = this.key !== this.currentKey;
      }
      return (keyChanged || !this._valuesEqual() || this.type !== this.currentType) && !this.isAdded();
    }

    /**
     * Check for value equality.
      * @returns {Boolean} If the value is equal.
     */

  }, {
    key: '_valuesEqual',
    value: function _valuesEqual() {
      if (this.currentType === 'Date' && isString(this.currentValue)) {
        return isEqual(this.value, new Date(this.currentValue));
      } else if (this.currentType === 'ObjectId' && isString(this.currentValue)) {
        return this._isObjectIdEqual();
      }
      return isEqual(this.value, this.currentValue);
    }
  }, {
    key: '_isObjectIdEqual',
    value: function _isObjectIdEqual() {
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

  }, {
    key: 'isLast',
    value: function isLast() {
      return this.parent.elements.lastElement === this;
    }

    /**
     * Can changes to the elemnt be reverted?
     *
     * @returns {Boolean} If the element can be reverted.
     */

  }, {
    key: 'isRevertable',
    value: function isRevertable() {
      return this.isEdited() || this.isRemoved();
    }

    /**
     * Can the element be removed?
     *
     * @returns {Boolean} If the element can be removed.
     */

  }, {
    key: 'isRemovable',
    value: function isRemovable() {
      return !this.parent.isRemoved();
    }

    /**
     * Can no action be taken on the element?
     *
     * @returns {Boolean} If no action can be taken.
     */

  }, {
    key: 'isNotActionable',
    value: function isNotActionable() {
      return this.key === ID && !this.isAdded() || !this.isRemovable();
    }

    /**
     * Determine if the value is editable.
     *
     * @returns {Boolean} If the value is editable.
     */

  }, {
    key: 'isValueEditable',
    value: function isValueEditable() {
      return this.isKeyEditable() && !includes(UNEDITABLE_TYPES, this.currentType);
    }

    /**
     * Determine if the key of the parent element is editable.
     *
     * @returns {Boolean} If the parent's key is editable.
     */

  }, {
    key: 'isParentEditable',
    value: function isParentEditable() {
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

  }, {
    key: 'isKeyEditable',
    value: function isKeyEditable() {
      return this.isParentEditable() && (this.isAdded() || this.currentKey !== ID);
    }

    /**
     * Determine if the element is modified at all.
     *
     * @returns {Boolean} If the element is modified.
     */

  }, {
    key: 'isModified',
    value: function isModified() {
      if (this.elements) {
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = this.elements[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var element = _step3.value;

            if (element.isModified()) {
              return true;
            }
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
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

  }, {
    key: 'isRemoved',
    value: function isRemoved() {
      return this.removed;
    }

    /**
     * Elements themselves are not the root.
     *
     * @returns {false} Always false.
     */

  }, {
    key: 'isRoot',
    value: function isRoot() {
      return false;
    }

    /**
     * Flag the element for removal.
     */

  }, {
    key: 'remove',
    value: function remove() {
      this.revert();
      this.removed = true;
      this._bubbleUp(Events.Removed);
    }

    /**
     * Revert the changes to the element.
     */

  }, {
    key: 'revert',
    value: function revert() {
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

  }, {
    key: '_bubbleUp',
    value: function _bubbleUp(evt, data) {
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

  }, {
    key: '_convertToEmptyObject',
    value: function _convertToEmptyObject() {
      this.edit({});
      this.insertPlaceholder();
    }

    /**
     * Convert to an empty array.
     */

  }, {
    key: '_convertToEmptyArray',
    value: function _convertToEmptyArray() {
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

  }, {
    key: '_isElementEmpty',
    value: function _isElementEmpty(element) {
      return element && element.isAdded() && element.isBlank();
    }

    /**
     * Check if the value is expandable.
     *
     * @param {Object} value - The value to check.
     *
     * @returns {Boolean} If the value is expandable.
     */

  }, {
    key: '_isExpandable',
    value: function _isExpandable(value) {
      return isObject(value) || isArray(value);
    }

    /**
     * Generates a sequence of child elements.
     *
     * @param {Object} object - The object to generate from.
     *
     * @returns {Array} The elements.
     */

  }, {
    key: '_generateElements',
    value: function _generateElements(object) {
      var elements = new LinkedList(); // eslint-disable-line no-use-before-define
      var index = 0;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = keys(object)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var key = _step4.value;

          elements.insertEnd(this._key(key, index), object[key], this.added, this);
          index++;
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
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

  }, {
    key: '_key',
    value: function _key(key, index) {
      return this.currentType === 'Array' ? index : key;
    }

    /**
     * Add a new element to the parent.
     */

  }, {
    key: '_next',
    value: function _next() {
      if (!this._isElementEmpty(this.nextElement) && !this._isElementEmpty(this)) {
        this.parent.insertAfter(this, '', '');
      }
    }

    /**
     * Removes the added elements from the element.
     */

  }, {
    key: '_removeAddedElements',
    value: function _removeAddedElements() {
      if (this.elements) {
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = this.elements[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var element = _step5.value;

            if (element.isAdded()) {
              this.elements.remove(element);
            }
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }
      }
    }
  }]);

  return Element;
}(EventEmitter);

/**
 * Represents a doubly linked list.
 */


var LinkedList = function () {
  _createClass(LinkedList, [{
    key: 'at',


    /**
     * Get the element at the provided index.
     *
     * @param {Integer} index - The index.
     *
     * @returns {Element} The matching element.
     */
    value: function at(index) {
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
  }, {
    key: 'get',
    value: function get(key) {
      this.flush();
      return this._map[key];
    }

    /**
     * Instantiate the new doubly linked list.
     */

  }]);

  function LinkedList(doc, originalDoc) {
    _classCallCheck(this, LinkedList);

    this.firstElement = null;
    this.lastElement = null;
    this.doc = doc;
    this.originalDoc = originalDoc;
    this.keys = keys(this.originalDoc);
    this.size = this.keys.length;
    this.loaded = 0;
    this.index = 0;
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


  _createClass(LinkedList, [{
    key: 'insertAfter',
    value: function insertAfter(element, key, value, added, parent) {
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
     * Update the currentKey of each element if array elements.
     *
     * @param {Element} element - The element to insert after.
     * @param {Number} add - 1 if adding a new element, -1 if removing.
     */

  }, {
    key: 'updateKeys',
    value: function updateKeys(element, add) {
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

  }, {
    key: 'handleEmptyKeys',
    value: function handleEmptyKeys(element) {
      if (element.currentKey === '') {
        var e = element;
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

  }, {
    key: 'insertBefore',
    value: function insertBefore(element, key, value, added, parent) {
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

  }, {
    key: 'insertBeginning',
    value: function insertBeginning(key, value, added, parent) {
      if (!this.firstElement) {
        var element = new Element(key, value, added, parent, null, null);
        this.firstElement = this.lastElement = element;
        this.size += 1;
        this.loaded += 1;
        this._map[element.key] = element;
        return element;
      }
      var newElement = this.insertBefore(this.firstElement, key, value, added, parent);
      this._map[newElement.key] = newElement;
      return newElement;
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

  }, {
    key: 'insertEnd',
    value: function insertEnd(key, value, added, parent) {
      if (!this.lastElement) {
        return this.insertBeginning(key, value, added, parent);
      }
      return this.insertAfter(this.lastElement, key, value, added, parent);
    }
  }, {
    key: 'flush',
    value: function flush() {
      if (this.loaded < this.size) {
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = this[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var _ = _step6.value;
          } // eslint-disable-line no-unused-var no-empty
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }
      }
    }

    /**
     * Get an iterator for the list.
     *
     * @returns {Iterator} The iterator.
     */

  }, {
    key: Symbol.iterator,
    value: function value() {
      var _this2 = this;

      var currentElement = void 0;
      return {
        next: function next() {
          // index 0
          // loaded 0
          // size 10
          //
          // index 5
          // loaded 4
          // size 10
          if (_this2._needsLazyLoad()) {
            // 1. When this is the first iteration:
            //   - Append each element on each next step.
            //   - Keep track of how far we were iterated and store the index.
            //   - Reduce size by 1 on each addition.
            var key = _this2.keys[_this2.index];
            _this2.index += 1;
            return { value: _this2._lazyInsertEnd(key) };
            // index 0
            // loaded 1
            // size 10
            //
            // index 0
            // loaded 10
            // size 10
          } else if (_this2._needsStandardIteration()) {
            // 2. When this is not the first iteration, but partially iterated before.
            //   - Iterate from the existing list up to the point where stopped.
            //   - Do step one from that point on.
            if (currentElement) {
              currentElement = currentElement.nextElement;
            } else {
              currentElement = _this2.firstElement;
            }
            _this2.index += 1;
            return { value: currentElement };
          }
          _this2.index = 0;
          return { done: true };
        }
      };
    }
  }, {
    key: '_needsLazyLoad',
    value: function _needsLazyLoad() {
      return this.index === 0 && this.loaded === 0 && this.size > 0 || this.loaded < this.index && this.index < this.size;
    }
  }, {
    key: '_needsStandardIteration',
    value: function _needsStandardIteration() {
      return this.loaded > 0 && this.index <= this.loaded && this.index < this.size;
    }

    /**
     * Insert on the end of the list lazily.
     *
     * @param {String} key - The key.
     *
     * @returns {Element} The inserted element.
     */

  }, {
    key: '_lazyInsertEnd',
    value: function _lazyInsertEnd(key) {
      this.size -= 1;
      return this.insertEnd(key, this.originalDoc[key], this.doc.cloned, this.doc);
    }

    /**
     * Remove the element from the list.
     *
     * @param {Element} element - The element to remove.
     *
     * @returns {DoublyLinkedList} The list with the element removed.
     */

  }, {
    key: 'remove',
    value: function remove(element) {
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
  }]);

  return LinkedList;
}();

module.exports = Element;
module.exports.LinkedList = LinkedList;
module.exports.Events = Events;
module.exports.DATE_FORMAT = DATE_FORMAT;