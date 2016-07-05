'use strict';

/**
 * An iterator for a linked list that returns data. The iteration
 * happens in a forward direction.
 */
class Iterator {

  /**
   * Instantiate an iterator with the first element.
   *
   * @param {Element} firstElement - The first element in the list.
   */
  constructor(firstElement) {
    this.element = firstElement;
  }

  /**
   * Get the next element's data in the list.
   *
   * @returns {Object} The next element's data.
   */
  next() {
    var element = this.element;
    if (element) {
      this.element = element.nextElement;
      return { value: element };
    }
    return { done: true };
  }
}

module.exports = Iterator;
