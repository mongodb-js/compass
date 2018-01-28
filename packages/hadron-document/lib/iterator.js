'use strict';

/**
 * An iterator for a linked list that returns data. The iteration
 * happens in a forward direction.
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Iterator = function () {

  /**
   * Instantiate an iterator with the first element.
   *
   * @param {Element} firstElement - The first element in the list.
   */
  function Iterator(firstElement) {
    _classCallCheck(this, Iterator);

    this.element = firstElement;
  }

  /**
   * Get the next element's data in the list.
   *
   * @returns {Object} The next element's data.
   */


  _createClass(Iterator, [{
    key: 'next',
    value: function next() {
      var element = this.element;
      if (element) {
        this.element = element.nextElement;
        return { value: element };
      }
      return { done: true };
    }
  }]);

  return Iterator;
}();

module.exports = Iterator;