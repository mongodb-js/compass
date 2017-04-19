const TypeChecker = require('hadron-type-checker');
const chars = require('../utils');
const StandardEditor = require('./standard');

/**
 * CRUD editor for string values.
 */
class StringEditor extends StandardEditor {

  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    const currentType = this.element.currentType;
    const stripped = value.substr(1, value.length - 2);
    try {
      const newValue = TypeChecker.cast(stripped, currentType);
      this.element.edit(newValue);
    } catch (e) {
      this.element.setInvalid(stripped, currentType, e.message);
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
    return chars(value);
  }

  /**
   * Get the value being edited.
   *
   * @returns {Object} The value.
   */
  value() {
    return `"${this.element.currentValue}"`;
  }
}

module.exports = StringEditor;
