import StandardEditor from './standard';

/**
 * Undefined is always 'undefined'
 */
const VALUE = 'undefined';

/**
 * CRUD editor for undefined values.
 */
export default class UndefinedEditor extends StandardEditor {
  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size(): number {
    return VALUE.length;
  }

  /**
   * Get the value being edited.
   *
   * @returns {Object} The value.
   */
  value(): 'undefined' {
    return VALUE;
  }
}
