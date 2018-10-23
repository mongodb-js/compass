'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

var Document = function (_EventEmitter) {
  _inherits(Document, _EventEmitter);

  _createClass(Document, [{
    key: 'cancel',


    /**
     * Send cancel event.
     */
    value: function cancel() {
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

      this.emit(Events.Cancel);
    }

    /**
     * Create the new document from the provided object.
     *
     * @param {Object} doc - The document.
     * @param {boolean} cloned - If it is a cloned document.
     */

  }]);

  function Document(doc, cloned) {
    _classCallCheck(this, Document);

    var _this = _possibleConstructorReturn(this, (Document.__proto__ || Object.getPrototypeOf(Document)).call(this));

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
    key: 'generateObject',
    value: function generateObject() {
      return ObjectGenerator.generate(this.elements);
    }

    /**
     * Get an element by its key.
     *
     * @param {String} key
     *
     * @returns {Element} The element.
     */

  }, {
    key: 'get',
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
    key: 'getChild',
    value: function getChild(path) {
      console.log(path);
      if (!path) {
        return undefined;
      }
      console.log(path[0]);
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
    key: 'getId',
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
    key: 'getStringId',
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
    key: 'insertPlaceholder',
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
    key: 'insertEnd',
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
    key: 'insertAfter',
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
    key: 'isAdded',
    value: function isAdded() {
      return false;
    }

    /**
     * Determine if the element is modified at all.
     *
     * @returns {Boolean} If the element is modified.
     */

  }, {
    key: 'isModified',
    value: function isModified() {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.elements[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var element = _step2.value;

          if (element.isModified()) {
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
     * A document is never removed
     *
     * @returns {false} Always false.
     */

  }, {
    key: 'isRemoved',
    value: function isRemoved() {
      return false;
    }

    /**
     * The document object is always the root object.
     *
     * @returns {true} Always true.
     */

  }, {
    key: 'isRoot',
    value: function isRoot() {
      return true;
    }

    /**
     * Handle the next element in the document.
     */

  }, {
    key: 'next',
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
    key: '_generateElements',
    value: function _generateElements() {
      return new LinkedList(this, this.doc);
    }
  }]);

  return Document;
}(EventEmitter);

module.exports = Document;
module.exports.Events = Events;