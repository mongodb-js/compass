const TypeChecker = require('hadron-type-checker');
const Events = require('../element-events');
const StandardEditor = require('./standard');

/**
 * CRUD editor for object id values.
 */
class ObjectIdEditor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }

  /**
   * Complete the object id edit by converting the valid string to an object id
   * object or leaving as invalid.
   */
  complete() {
    super.complete();
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(TypeChecker.cast(this.element.currentValue, 'ObjectId'));
    }
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    try {
      TypeChecker.cast(value, 'ObjectId');
      this.element.currentValue = value;
      this.element.setValid();
      this.element._bubbleUp(Events.Edited, this.element);
    } catch (e) {
      this.element.setInvalid(value, this.element.currentType, e.message);
    }
  }

  /**
   * Start the object id edit.
   */
  start() {
    super.start();
    if (this.element.isCurrentTypeValid()) {
      this.edit(String(this.element.currentValue));
    }
  }
}

module.exports = ObjectIdEditor;
