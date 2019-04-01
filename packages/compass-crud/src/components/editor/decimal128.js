import TypeChecker from 'hadron-type-checker';
import { Element } from 'hadron-document';
import StandardEditor from './standard';
import chars from 'utils';

/**
 * CRUD editor for decimal128 values.
 */
class Decimal128Editor extends StandardEditor {

  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }

  /**
   * Complete the decimal128 edit by converting the valid string to a decimal128
   * value or leaving as invalid.
   */
  complete() {
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(TypeChecker.cast(this.element.currentValue, 'Decimal128'));
    }
  }

  /**
   * Edit Decimal128 element. Check if the value is a Decimal128 before setting typed
   * up value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    try {
      TypeChecker.cast(value, 'Decimal128');
      this.element.currentValue = value;
      this.element.setValid();
      this.element._bubbleUp(Element.Events.Edited);
    } catch (error) {
      this.element.setInvalid(value, this.element.currentType, error.message);
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
    return chars(this.element.currentValue);
  }
}

export default Decimal128Editor;
