import TypeChecker from 'hadron-type-checker';
import Events from '../element-events';
import StandardEditor from './standard';
import type Element from '../element';
import type { BSONValue } from '../utils';

/**
 * CRUD editor for object id values.
 */
export default class ObjectIdEditor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element: Element) {
    super(element);
  }

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
      this.element.currentValue = value;
      this.element.setValid();
      this.element._bubbleUp(Events.Edited, this.element);
    } catch (e: any) {
      this.element.setInvalid(value, this.element.currentType, e.message);
    }
  }

  /**
   * Start the object id edit.
   */
  start(): void {
    super.start();
    if (this.element.isCurrentTypeValid()) {
      this.edit(String(this.element.currentValue));
    }
  }
}
