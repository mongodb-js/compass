import StandardEditor from './standard';

export const STRING_TYPE = 'String';

/**
 * CRUD editor for string values.
 */
class StringEditor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }
}

export default StringEditor;
