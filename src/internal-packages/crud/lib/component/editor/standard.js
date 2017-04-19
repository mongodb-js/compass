const TypeChecker = require('hadron-type-checker');
const chars = require('../utils');

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
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size() {
    const value = this.element.currentValue;
    switch (this.element.currentType) {
      case 'Int32':
        return chars(value.valueOf());
      case 'Int64':
        return chars(value);
      case 'Double':
        return chars(value.value);
      default:
        return chars(value);
    }
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
