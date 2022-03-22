const TypeChecker = require('hadron-type-checker');
const Element = require('../element');
const { fieldStringLen } = require('../utils');

/**
 * Regex to match an array or object string.
 */
const ARRAY_OR_OBJECT = /^(\[|\{)(.+)(\]|\})$/;

/**
 * CRUD editor for standard values.
 */
class StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    this.element = element;
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    const currentType = this.element.currentType;
    try {
      const newValue = TypeChecker.cast(value, currentType);
      this.element.edit(newValue);
    } catch (e) {
      this.element.setInvalid(value, currentType, e.message);
    }
  }

  /**
   * Edit the element via a paste.
   *
   * @param {String} value - The balue.
   */
  paste(value) {
    if (value.match(ARRAY_OR_OBJECT)) {
      this.edit(JSON.parse(value));
      this.element._bubbleUp(Element.Events.Converted);
    } else {
      this.edit(value);
    }
  }


  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size() {
    return fieldStringLen(this.element.currentValue);
  }

  /**
   * Get the value being edited.
   *
   * @returns {Object} The value.
   */
  value() {
    return this.element.currentValue;
  }

  // Standard editing requires no special start/complete behaviour.
  start() {}
  complete() {}
}

module.exports = StandardEditor;
