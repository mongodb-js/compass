import TypeChecker from 'hadron-type-checker';
import Events from '../element-events';
import type { BSONValue } from '../utils';
import { fieldStringLen } from '../utils';
import StandardEditor from './standard';
import type Element from '../element';

/**
 * CRUD editor for double values.
 */
export default class DoubleEditor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element: Element) {
    super(element);
  }

  /**
   * Complete the double edit by converting the valid string to a double
   * value or leaving as invalid.
   */
  complete(): void {
    super.complete();
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
  edit(value: BSONValue): void {
    try {
      const double = TypeChecker.cast(value, 'Double');
      if (isNaN(double.value)) {
        this.element.setInvalid(
          value,
          'Double',
          `${String(value)} is not a valid double format`
        );
      } else {
        this.element.currentValue = value;
        this.element.setValid();
        this.element._bubbleUp(Events.Edited, this.element);
      }
    } catch (error: any) {
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
  size(): number {
    const currentValue = this.element.currentValue as any;
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
