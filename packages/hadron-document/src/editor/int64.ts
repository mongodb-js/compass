import TypeChecker from 'hadron-type-checker';
import Events from '../element-events';
import StandardEditor from './standard';
import type Element from '../element';
import type { BSONValue } from '../utils';

/**
 * CRUD editor for int32 values.
 */
export default class Int64Editor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element: Element) {
    super(element);
  }

  /**
   * Complete the int64 edit by converting the valid string to a int64
   * value or leaving as invalid.
   */
  complete(): void {
    super.complete();
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
  edit(value: BSONValue): void {
    try {
      TypeChecker.cast(value, 'Int64');
      this.element.currentValue = value;
      this.element.setValid();
      this.element._bubbleUp(Events.Edited, this.element);
    } catch (error: any) {
      this.element.setInvalid(value, this.element.currentType, error.message);
    }
  }
}
