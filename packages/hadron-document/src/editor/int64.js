const TypeChecker = require('hadron-type-checker');
const Element = require('../element');
const StandardEditor = require('./standard');

/**
 * CRUD editor for int32 values.
 */
class Int64Editor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }

  /**
   * Complete the int64 edit by converting the valid string to a int64
   * value or leaving as invalid.
   */
  complete() {
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(TypeChecker.cast(this.element.currentValue, 'Int64'));
    }
  }

  /**
   * Edit Int64 element. Check if the value is a Int64 before setting typed
   * up value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    try {
      TypeChecker.cast(value, 'Int64');
      this.element.currentValue = value;
      this.element.setValid();
      this.element._bubbleUp(Element.Events.Edited);
    } catch (error) {
      this.element.setInvalid(value, this.element.currentType, error.message);
    }
  }
}

module.exports = Int64Editor;
