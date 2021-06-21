'use strict';

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

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

  }, {
    key: "generateUpdateUnlessChangedInBackgroundQuery",
    value: function generateUpdateUnlessChangedInBackgroundQuery() {
      var alwaysIncludeKeys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      // Build a query that will find the document to update only if it has the
      // values of elements that were changed with their original value.
      // This query won't find the document if an updated element's value isn't
      // the same value as it was when it was originally loaded.
      var originalFieldsThatWillBeUpdated = this.getOriginalKeysAndValuesForFieldsThatWereUpdated(alwaysIncludeKeys);

      var query = _objectSpread({
        _id: this.getId()
      }, originalFieldsThatWillBeUpdated); // Build the update document to be used in an update operation with `$set`
      // and `$unset` reflecting the changes that have occured in the document.


      var setUpdateObject = this.getSetUpdateForDocumentChanges();
      var unsetUpdateObject = this.getUnsetUpdateForDocumentChanges();
      var updateDoc = {};

      if (setUpdateObject && Object.keys(setUpdateObject).length > 0) {
        updateDoc.$set = setUpdateObject;
      }

      if (unsetUpdateObject && Object.keys(unsetUpdateObject).length > 0) {
        updateDoc.$unset = unsetUpdateObject;
      }

      return {
        query: query,
        updateDoc: updateDoc
      };
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

  }, {
    key: "getOriginalKeysAndValuesForFieldsThatWereUpdated",
    value: function getOriginalKeysAndValuesForFieldsThatWereUpdated() {
      var alwaysIncludeKeys = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var object = {};

      if (this.elements) {
        var _iterator2 = _createForOfIteratorHelper(this.elements),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var element = _step2.value;

            if (element.isModified() && !element.isAdded() || alwaysIncludeKeys && element.key in alwaysIncludeKeys) {
              // Using `.key` instead of `.currentKey` to ensure we look at
              // the original field's value.
              object[element.key] = element.generateOriginalObject();
            }

            if (element.isAdded() && element.currentKey !== '') {
              // When a new field is added, check if that field
              // was already added in the background.
              object[element.currentKey] = {
                $exists: false
              };
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
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

  }, {
    key: "getOriginalKeysAndValuesForSpecifiedKeys",
    value: function getOriginalKeysAndValuesForSpecifiedKeys(keys) {
      var object = {};

      if (this.elements) {
        var _iterator3 = _createForOfIteratorHelper(this.elements),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var element = _step3.value;

            if (element.key in keys) {
              // Using `.key` instead of `.currentKey` to ensure we look at
              // the original field's value.
              object[element.key] = element.generateOriginalObject();
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
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

  }, {
    key: "getSetUpdateForDocumentChanges",
    value: function getSetUpdateForDocumentChanges() {
      var object = {};

      if (this.elements) {
        var _iterator4 = _createForOfIteratorHelper(this.elements),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var element = _step4.value;

            if (!element.isRemoved() && element.currentKey !== '' && element.isModified()) {
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
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }
      }

      return object;
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
     * Generate an $unset javascript object, that can be used in update
     * operations, with the removals from the document.
     *
     * @returns {Object} The javascript update object.
    **/

  }, {
    key: "getUnsetUpdateForDocumentChanges",
    value: function getUnsetUpdateForDocumentChanges() {
      var object = {};

      if (this.elements) {
        var _iterator5 = _createForOfIteratorHelper(this.elements),
            _step5;

        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var element = _step5.value;

            if (!element.isAdded() && element.isRemoved() && element.key !== '') {
              object[element.key] = true;
            }

            if (!element.isAdded() && element.isRenamed() && element.key !== '') {
              // Remove the original field when an element is renamed.
              object[element.key] = true;
            }
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
      }

      return object;
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
      var _iterator6 = _createForOfIteratorHelper(this.elements),
          _step6;

      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var element = _step6.value;

          if (element.isModified()) {
            return true;
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
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