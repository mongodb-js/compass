import StandardEditor from './standard';
import type Element from '../element';

export const STRING_TYPE = 'String';

/**
 * CRUD editor for string values.
 */
export default class StringEditor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element: Element) {
    super(element);
  }
}
