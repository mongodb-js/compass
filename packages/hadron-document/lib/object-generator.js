'use strict';
/**
 * Generates javascript objects from elements.
 */

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ObjectGenerator = /*#__PURE__*/function () {
  function ObjectGenerator() {
    _classCallCheck(this, ObjectGenerator);
  }

  _createClass(ObjectGenerator, [{
    key: "generate",
    value:
    /**
     * Generate a javascript object from the elements.
     *
     * @param {Array} elements - The elements.
     *
     * @returns {Object} The javascript object.
     */
    function generate(elements) {
      if (elements) {
        var object = {};

        var _iterator = _createForOfIteratorHelper(elements),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var element = _step.value;

            if (!element.isRemoved() && element.currentKey !== '') {
              object[element.currentKey] = element.generateObject();
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        return object;
      }

      return elements;
    }
    /**
     * Generate a javascript object from the elements with their original keys
     * and values. This can be used in a query with an update to
     * ensure the values on the document to edit are still up to date.
     *
     * @param {Array} elements - The elements.
     *
     * @returns {Object} The javascript object.
     */

  }, {
    key: "generateOriginal",
    value: function generateOriginal(elements) {
      if (elements) {
        var object = {};

        var _iterator2 = _createForOfIteratorHelper(elements),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var element = _step2.value;

            if (!element.isAdded()) {
              object[element.key] = element.generateOriginalObject();
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }

        return object;
      }

      return elements;
    }
    /**
     * Generate an array from the elements.
     *
     * @param {Array} elements - The elements.
     *
     * @returns {Array} The array.
     */

  }, {
    key: "generateArray",
    value: function generateArray(elements) {
      if (elements) {
        var array = [];

        var _iterator3 = _createForOfIteratorHelper(elements),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var element = _step3.value;

            if (!element.isRemoved()) {
              if (element.elements) {
                array.push(element.generateObject());
              } else {
                array.push(element.currentValue);
              }
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }

        return array;
      }

      return elements;
    }
    /**
     * Generate an array from the elements using their original values.
     *
     * @param {Array} elements - The elements.
     *
     * @returns {Array} The array.
     */

  }, {
    key: "generateOriginalArray",
    value: function generateOriginalArray(elements) {
      if (elements) {
        var array = [];

        var _iterator4 = _createForOfIteratorHelper(elements),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var element = _step4.value;

            if (element.originalExpandableValue) {
              array.push(element.generateOriginalObject());
            } else if (!element.isAdded()) {
              array.push(element.value);
            }
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }

        return array;
      }

      return elements;
    }
  }]);

  return ObjectGenerator;
}();

module.exports = new ObjectGenerator();