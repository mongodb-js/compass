const { fieldStringLen } = require('../utils');
const StandardEditor = require('./standard');

/**
 * CRUD editor for int32 values.
 */
class Int32Editor extends StandardEditor {
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
    return fieldStringLen(this.element.currentValue.valueOf());
  }
}

module.exports = Int32Editor;
