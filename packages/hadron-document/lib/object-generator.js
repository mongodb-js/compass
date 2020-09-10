'use strict';

/**
 * Generates javascript objects from elements.
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ObjectGenerator = function () {
  function ObjectGenerator() {
    _classCallCheck(this, ObjectGenerator);
  }

  _createClass(ObjectGenerator, [{
    key: 'generate',

    /**
     * Generate a javascript object from the elements.
     *
     * @param {Array} elements - The elements.
     *
     * @returns {Object} The javascript object.
     */
    value: function generate(elements) {
      if (elements) {
        var object = {};
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = elements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var element = _step.value;

            if (!element.isRemoved() && element.currentKey !== '') {
              object[element.currentKey] = element.generateObject();
            }
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
    key: 'generateOriginal',
    value: function generateOriginal(elements) {
      if (elements) {
        var object = {};
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = elements[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var element = _step2.value;

            if (!element.isAdded()) {
              object[element.key] = element.generateOriginalObject();
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
    key: 'generateArray',
    value: function generateArray(elements) {
      if (elements) {
        var array = [];
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = elements[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
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
    key: 'generateOriginalArray',
    value: function generateOriginalArray(elements) {
      if (elements) {
        var array = [];
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = elements[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var element = _step4.value;

            if (element.originalExpandableValue) {
              array.push(element.generateOriginalObject());
            } else if (!element.isAdded()) {
              array.push(element.value);
            }
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

        return array;
      }
      return elements;
    }
  }]);

  return ObjectGenerator;
}();

module.exports = new ObjectGenerator();