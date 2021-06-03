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

var Element = require('./element');

var LinkedList = Element.LinkedList;

var ObjectGenerator = require('./object-generator');
/**
 * The event constant.
 */


var Events = {
  'Cancel': 'Document::Cancel'
};
/**
 * The id field.
 */

var ID = '_id';
/**
 * Represents a document.
 */

var Document = /*#__PURE__*/function (_EventEmitter) {
  _inherits(Document, _EventEmitter);

  var _super = _createSuper(Document);

  /**
   * Create the new document from the provided object.
   *
   * @param {Object} doc - The document.
   * @param {boolean} cloned - If it is a cloned document.
   */
  function Document(doc, cloned) {
    var _this;

    _classCallCheck(this, Document);

    _this = _super.call(this);
    _this.doc = doc;
    _this.cloned = cloned || false;
    _this.isUpdatable = true;
    _this.elements = _this._generateElements();
    return _this;
  }
  /**
   * Generate the javascript object for this document.
   *
   * @returns {Object} The javascript object.
   */


  _createClass(Document, [{
    key: "cancel",
    value:
    /**
     * Send cancel event.
     */
    function cancel() {
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

      this.emit(Events.Cancel);
    }
  }, {
    key: "generateObject",
    value: function generateObject() {
      return ObjectGenerator.generate(this.elements);
    }
    /**
     * Generate the javascript object with the original elements in this document.
     *
     * @returns {Object} The original javascript object.
     */

  }, {
    key: "generateOriginalObject",
    value: function generateOriginalObject() {
      return ObjectGenerator.generateOriginal(this.elements);
    }
    /**
     * Get an element by its key.
     *
     * @param {String} key
     *
     * @returns {Element} The element.
     */

  }, {
    key: "get",
    value: function get(key) {
      return this.elements.get(key);
    }
    /**
     * Get an element by a series of segment names.
     *
     * @param {Array} path - The series of fieldnames. Cannot be empty.
     *
     * @returns {Element} The element.
     */

  }, {
    key: "getChild",
    value: function getChild(path) {
      if (!path) {
        return undefined;
      }

      var element = this.currentType === 'Array' ? this.elements.at(path[0]) : this.elements.get(path[0]);
      var i = 1;

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

  }, {
    key: "getId",
    value: function getId() {
      var element = this.get(ID);
      return element ? element.generateObject() : null;
    }
    /**
     * Get the _id value as a string. Required if _id is not always an ObjectId.
     *
     * @returns {String} The string id.
     */

  }, {
    key: "getStringId",
    value: function getStringId() {
      var element = this.get(ID);

      if (!element) {
        return null;
      } else if (element.currentType === 'Array' || element.currentType === 'Object') {
        return JSON.stringify(element.generateObject());
      }

      return '' + element.value;
    }
    /**
     * Insert a placeholder element at the end of the document.
     *
     * @returns {Element} The placeholder element.
     */

  }, {
    key: "insertPlaceholder",
    value: function insertPlaceholder() {
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

  }, {
    key: "insertEnd",
    value: function insertEnd(key, value) {
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

  }, {
    key: "insertAfter",
    value: function insertAfter(element, key, value) {
      var newElement = this.elements.insertAfter(element, key, value, true, this);
      this.emit(Element.Events.Added);
      return newElement;
    }
    /**
     * A document always exists, is never added.
     *
     * @returns {false} Always false.
     */

  }, {
    key: "isAdded",
    value: function isAdded() {
      return false;
    }
    /**
     * Determine if the element is modified at all.
     *
     * @returns {Boolean} If the element is modified.
     */

  }, {
    key: "isModified",
    value: function isModified() {
      var _iterator2 = _createForOfIteratorHelper(this.elements),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var element = _step2.value;

          if (element.isModified()) {
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
     * A document is never removed
     *
     * @returns {false} Always false.
     */

  }, {
    key: "isRemoved",
    value: function isRemoved() {
      return false;
    }
    /**
     * The document object is always the root object.
     *
     * @returns {true} Always true.
     */

  }, {
    key: "isRoot",
    value: function isRoot() {
      return true;
    }
    /**
     * Handle the next element in the document.
     */

  }, {
    key: "next",
    value: function next() {
      this.elements.flush();
      var lastElement = this.elements.lastElement;

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

  }, {
    key: "_generateElements",
    value: function _generateElements() {
      return new LinkedList(this, this.doc);
    }
  }]);

  return Document;
}(EventEmitter);

module.exports = Document;
module.exports.Events = Events;