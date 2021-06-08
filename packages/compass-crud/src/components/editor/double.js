import TypeChecker from 'hadron-type-checker';
import { Element } from 'hadron-document';
import StandardEditor from './standard';
import { fieldStringLen } from '../../utils';

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
   * Complete the double edit by converting the valid string to a double
   * value or leaving as invalid.
   */
  complete() {
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(TypeChecker.cast(this.element.currentValue, 'Double'));
    }
  }

  /**
   * Edit Double element. Check if the value is a Double before setting tped
   * up value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    try {
      const double = TypeChecker.cast(value, 'Double');
      if (isNaN(double.value)) {
        this.element.setInvalid(value, 'Double', `${value} is not a valid double format`);
      } else {
        this.element.currentValue = value;
        this.element.setValid();
        this.element._bubbleUp(Element.Events.Edited);
      }
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
    const currentValue = this.element.currentValue;
    return fieldStringLen(
      // Not all values that will be checked here are bson types with a `value`
      // property, using valueOf is a more resilient way of getting the "native"
      // value from `currentValue`
      typeof currentValue.valueOf === 'function'
        ? currentValue.valueOf()
        : currentValue
    );
  }
}

export default DoubleEditor;
