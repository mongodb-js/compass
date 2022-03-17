const StandardEditor = require('./standard');

/**
 * Null is always 'null'
 */
const VALUE = 'null';

/**
 * CRUD editor for null values.
 */
class NullEditor extends StandardEditor {
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
    return 4;
  }

  /**
   * Get the value being edited.
   *
   * @returns {Object} The value.
   */
  value() {
    return VALUE;
  }
}

module.exports = NullEditor;
