import TypeChecker from 'hadron-type-checker';
import StandardEditor from './standard';
import type { BSONValue } from '../utils';

/**
 * CRUD editor for decimal128 values.
 */
export default class Decimal128Editor extends StandardEditor {
  /**
   * Complete the decimal128 edit by converting the valid string to a decimal128
   * value or leaving as invalid.
   */
  complete(): void {
    super.complete();
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(
        TypeChecker.cast(this.element.currentValue, 'Decimal128')
      );
    }
  }

  /**
   * Edit Decimal128 element. Check if the value is a Decimal128 before setting typed
   * up value.
   *
   * @param {Object} value - The new value.
   */
  edit(value: BSONValue): void {
    try {
      TypeChecker.cast(value, 'Decimal128');
      this.element._setEditedValue(value);
    } catch (error: any) {
      this.element.setInvalid(value, this.element.currentType, error.message);
    }
  }
}
