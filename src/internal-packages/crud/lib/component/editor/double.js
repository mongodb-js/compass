const chars = require('../utils');
const StandardEditor = require('./standard');

/**
 * CRUD editor for double values.
 */
class DoubleEditor extends StandardEditor {

  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }

  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size() {
    return chars(this.element.currentValue.value);
  }
}

module.exports = DoubleEditor;
