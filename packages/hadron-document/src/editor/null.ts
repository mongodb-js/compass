import StandardEditor from './standard';
import type Element from '../element';

/**
 * Null is always 'null'
 */
const VALUE = 'null';

/**
 * CRUD editor for null values.
 */
export default class NullEditor extends StandardEditor {
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
    return 4;
  }

  /**
   * Get the value being edited.
   *
   * @returns {Object} The value.
   */
  value(): 'null' {
    return VALUE;
  }
}
