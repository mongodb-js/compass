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
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = elements[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var element = _step2.value;

            if (!element.isRemoved()) {
              if (element.elements) {
                array.push(element.generateObject());
              } else {
                array.push(element.currentValue);
              }
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

        return array;
      }
      return elements;
    }
  }]);

  return ObjectGenerator;
}();

module.exports = new ObjectGenerator();