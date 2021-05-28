'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

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

var Element = /*#__PURE__*/function (_EventEmitter) {
  _inherits(Element, _EventEmitter);

  var _super = _createSuper(Element);

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
  function Element(key, value, added, parent, previousElement, nextElement) {
    var _this;

    _classCallCheck(this, Element);

    _this = _super.call(this);
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
    key: "bulkEdit",
    value:
    /**
     * Bulk edit the element. Can accept JSON strings.
     *
     * @param {String} value - The JSON string value.
     */
    function bulkEdit(value) {
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
    key: "cancel",
    value: function cancel() {
      if (this.elements) {
        var _iterator = _createForOfIteratorHelper(this.elements),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var element = _step.value;
            element.cancel();
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      if (this.isModified()) {
        this.revert();
      }
    }
  }, {
    key: "edit",
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
    key: "get",
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
    key: "at",
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
    key: "next",
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
    key: "rename",
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
    key: "generateObject",
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
     * Generate the javascript object representing the original values
     * for this element (pre-element removal, renaming, editing).
     *
     * @returns {Object} The javascript object.
     */

  }, {
    key: "generateOriginalObject",
    value: function generateOriginalObject() {
      if (this.type === 'Array') {
        var originalElements = this._generateElements(this.originalExpandableValue);

        return ObjectGenerator.generateOriginalArray(originalElements);
      }

      if (this.type === 'Object') {
        var _originalElements = this._generateElements(this.originalExpandableValue);

        return ObjectGenerator.generateOriginal(_originalElements);
      }

      return this.value;
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
    key: "insertAfter",
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
    key: "insertEnd",
    value: function insertEnd(key, value) {
      if (this.currentType === 'Array') {
        this.elements.flush();
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
    key: "insertPlaceholder",
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
    key: "isAdded",
    value: function isAdded() {
      return this.added || this.parent && this.parent.isAdded();
    }
    /**
     * Is the element blank?
     *
     * @returns {Boolean} If the element is blank.
     */

  }, {
    key: "isBlank",
    value: function isBlank() {
      return this.currentKey === '' && this.currentValue === '';
    }
    /**
     * Does the element have a valid value for the current type?
     *
     * @returns {Boolean} If the value is valid.
     */

  }, {
    key: "isCurrentTypeValid",
    value: function isCurrentTypeValid() {
      return this.currentTypeValid;
    }
    /**
     * Set the element as valid.
     */

  }, {
    key: "setValid",
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
    key: "setInvalid",
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
    key: "isDuplicateKey",
    value: function isDuplicateKey(value) {
      if (value === this.currentKey) {
        return false;
      }

      var _iterator2 = _createForOfIteratorHelper(this.parent.elements),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var element = _step2.value;

          if (element.currentKey === value) {
            return true;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
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
    key: "isEdited",
    value: function isEdited() {
      return (this.isRenamed() || !this._valuesEqual() || this.type !== this.currentType) && !this.isAdded();
    }
    /**
     * Check for value equality.
      * @returns {Boolean} If the value is equal.
     */

  }, {
    key: "_valuesEqual",
    value: function _valuesEqual() {
      if (this.currentType === 'Date' && isString(this.currentValue)) {
        return isEqual(this.value, new Date(this.currentValue));
      } else if (this.currentType === 'ObjectId' && isString(this.currentValue)) {
        return this._isObjectIdEqual();
      }

      return isEqual(this.value, this.currentValue);
    }
  }, {
    key: "_isObjectIdEqual",
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
    key: "isLast",
    value: function isLast() {
      return this.parent.elements.lastElement === this;
    }
    /**
     * Determine if the element is renamed.
     *
     * @returns {Boolean} If the element was renamed.
     */

  }, {
    key: "isRenamed",
    value: function isRenamed() {
      var keyChanged = false;

      if (!this.parent || this.parent.isRoot() || this.parent.currentType === 'Object') {
        keyChanged = this.key !== this.currentKey;
      }

      return keyChanged;
    }
    /**
     * Can changes to the elemnt be reverted?
     *
     * @returns {Boolean} If the element can be reverted.
     */

  }, {
    key: "isRevertable",
    value: function isRevertable() {
      return this.isEdited() || this.isRemoved();
    }
    /**
     * Can the element be removed?
     *
     * @returns {Boolean} If the element can be removed.
     */

  }, {
    key: "isRemovable",
    value: function isRemovable() {
      return !this.parent.isRemoved();
    }
    /**
     * Can no action be taken on the element?
     *
     * @returns {Boolean} If no action can be taken.
     */

  }, {
    key: "isNotActionable",
    value: function isNotActionable() {
      return this.key === ID && !this.isAdded() || !this.isRemovable();
    }
    /**
     * Determine if the value is editable.
     *
     * @returns {Boolean} If the value is editable.
     */

  }, {
    key: "isValueEditable",
    value: function isValueEditable() {
      return this.isKeyEditable() && !includes(UNEDITABLE_TYPES, this.currentType);
    }
    /**
     * Determine if the key of the parent element is editable.
     *
     * @returns {Boolean} If the parent's key is editable.
     */

  }, {
    key: "isParentEditable",
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
    key: "isKeyEditable",
    value: function isKeyEditable() {
      return this.isParentEditable() && (this.isAdded() || this.currentKey !== ID);
    }
    /**
     * Determine if the element is modified at all.
     *
     * @returns {Boolean} If the element is modified.
     */

  }, {
    key: "isModified",
    value: function isModified() {
      if (this.elements) {
        var _iterator3 = _createForOfIteratorHelper(this.elements),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var element = _step3.value;

            if (element.isModified()) {
              return true;
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
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
    key: "isRemoved",
    value: function isRemoved() {
      return this.removed;
    }
    /**
     * Elements themselves are not the root.
     *
     * @returns {false} Always false.
     */

  }, {
    key: "isRoot",
    value: function isRoot() {
      return false;
    }
    /**
     * Flag the element for removal.
     */

  }, {
    key: "remove",
    value: function remove() {
      this.revert();
      this.removed = true;

      this._bubbleUp(Events.Removed);
    }
    /**
     * Revert the changes to the element.
     */

  }, {
    key: "revert",
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
    key: "_bubbleUp",
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
    key: "_convertToEmptyObject",
    value: function _convertToEmptyObject() {
      this.edit({});
      this.insertPlaceholder();
    }
    /**
     * Convert to an empty array.
     */

  }, {
    key: "_convertToEmptyArray",
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
    key: "_isElementEmpty",
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
    key: "_isExpandable",
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
    key: "_generateElements",
    value: function _generateElements(object) {
      return new LinkedList(this, object); // eslint-disable-line no-use-before-define
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
    key: "_key",
    value: function _key(key, index) {
      return this.currentType === 'Array' ? index : key;
    }
    /**
     * Add a new element to the parent.
     */

  }, {
    key: "_next",
    value: function _next() {
      if (!this._isElementEmpty(this.nextElement) && !this._isElementEmpty(this)) {
        this.parent.insertAfter(this, '', '');
      }
    }
    /**
     * Removes the added elements from the element.
     */

  }, {
    key: "_removeAddedElements",
    value: function _removeAddedElements() {
      if (this.elements) {
        var _iterator4 = _createForOfIteratorHelper(this.elements),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var element = _step4.value;

            if (element.isAdded()) {
              this.elements.remove(element);
            }
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }
    }
  }]);

  return Element;
}(EventEmitter);
/**
 * Represents a doubly linked list.
 */


var LinkedList = /*#__PURE__*/function () {
  // Instantiate the new doubly linked list.
  function LinkedList(doc, originalDoc) {
    _classCallCheck(this, LinkedList);

    this.firstElement = null;
    this.lastElement = null;
    this.doc = doc;
    this.originalDoc = originalDoc;
    this.keys = keys(this.originalDoc);

    if (this.doc.currentType === 'Array') {
      this.keys = this.keys.map(function (k) {
        return parseInt(k, 10);
      });
    }

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


  _createClass(LinkedList, [{
    key: "at",
    value:
    /**
     * Get the element at the provided index.
     *
     * @param {Integer} index - The index.
     *
     * @returns {Element} The matching element.
     */
    function at(index) {
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
    key: "get",
    value: function get(key) {
      this.flush();
      return this._map[key];
    }
  }, {
    key: "insertAfter",
    value: function insertAfter(element, key, value, added, parent) {
      this.flush();
      return this._insertAfter(element, key, value, added, parent);
    }
    /**
     * Update the currentKey of each element if array elements.
     *
     * @param {Element} element - The element to insert after.
     * @param {Number} add - 1 if adding a new element, -1 if removing.
     */

  }, {
    key: "updateKeys",
    value: function updateKeys(element, add) {
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

  }, {
    key: "handleEmptyKeys",
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
    key: "insertBefore",
    value: function insertBefore(element, key, value, added, parent) {
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

  }, {
    key: "insertBeginning",
    value: function insertBeginning(key, value, added, parent) {
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

  }, {
    key: "insertEnd",
    value: function insertEnd(key, value, added, parent) {
      this.flush();

      if (!this.lastElement) {
        return this.insertBeginning(key, value, added, parent);
      }

      return this.insertAfter(this.lastElement, key, value, added, parent);
    }
  }, {
    key: "flush",
    value: function flush() {
      if (this.loaded < this.size) {
        // Only iterate from the loaded index to the size.
        var _iterator5 = _createForOfIteratorHelper(this),
            _step5;

        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var element = _step5.value;

            if (element && element.elements) {
              element.elements.flush();
            }
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
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

      var currentElement;
      var index = 0;
      return {
        next: function next() {
          if (_this2._needsLazyLoad(index)) {
            var key = _this2.keys[index];
            index += 1;
            currentElement = _this2._lazyInsertEnd(key);
            return {
              value: currentElement
            };
          } else if (_this2._needsStandardIteration(index)) {
            if (currentElement) {
              currentElement = currentElement.nextElement;
            } else {
              currentElement = _this2.firstElement;
            }

            if (currentElement) {
              index += 1;
              return {
                value: currentElement
              };
            }

            return {
              done: true
            };
          }

          return {
            done: true
          };
        }
      };
    }
  }, {
    key: "_needsLazyLoad",
    value: function _needsLazyLoad(index) {
      return index === 0 && this.loaded === 0 && this.size > 0 || this.loaded <= index && index < this.size;
    }
  }, {
    key: "_needsStandardIteration",
    value: function _needsStandardIteration(index) {
      return this.loaded > 0 && index < this.loaded && index < this.size;
    }
    /**
     * Insert on the end of the list lazily.
     *
     * @param {String} key - The key.
     *
     * @returns {Element} The inserted element.
     */

  }, {
    key: "_lazyInsertEnd",
    value: function _lazyInsertEnd(key) {
      this.size -= 1;
      return this._insertEnd(key, this.originalDoc[key], this.doc.cloned, this.doc);
    }
  }, {
    key: "_insertEnd",
    value: function _insertEnd(key, value, added, parent) {
      if (!this.lastElement) {
        return this._insertBeginning(key, value, added, parent);
      }

      return this._insertAfter(this.lastElement, key, value, added, parent);
    }
  }, {
    key: "_insertBefore",
    value: function _insertBefore(element, key, value, added, parent) {
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
  }, {
    key: "_insertBeginning",
    value: function _insertBeginning(key, value, added, parent) {
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
  }, {
    key: "_insertAfter",
    value: function _insertAfter(element, key, value, added, parent) {
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

  }, {
    key: "remove",
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