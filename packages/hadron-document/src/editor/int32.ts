import { fieldStringLen } from '../utils';
import StandardEditor from './standard';
import type Element from '../element';

/**
 * CRUD editor for int32 values.
 */
export default class Int32Editor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element: Element) {
    super(element);
  }

  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size(): number {
    return fieldStringLen(
      (this.element.currentValue as any as number).valueOf()
    );
  }
}
