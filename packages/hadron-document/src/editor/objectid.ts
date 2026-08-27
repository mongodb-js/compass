import TypeChecker from 'hadron-type-checker';
import StandardEditor from './standard';
import type { BSONValue } from '../utils';

/**
 * CRUD editor for object id values.
 */
export default class ObjectIdEditor extends StandardEditor {
  /**
   * Complete the object id edit by converting the valid string to an object id
   * object or leaving as invalid.
   */
  complete(): void {
    super.complete();
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(
        TypeChecker.cast(this.element.currentValue, 'ObjectId')
      );
    }
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value: BSONValue): void {
    try {
      TypeChecker.cast(value, 'ObjectId');
      this.element._setEditedValue(value);
    } catch (e: any) {
      this.element.setInvalid(value, this.element.currentType, e.message);
    }
  }

  /**
   * Start the object id edit.
   */
  start(): void {
    // Converting to the editable form is not itself an edit, so it happens
    // before the edit session starts.
    if (this.element.isCurrentTypeValid()) {
      this.edit(String(this.element.currentValue));
    }
    super.start();
  }
}
