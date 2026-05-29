import StandardEditor from './standard';

/**
 * Null is always 'null'
 */
const VALUE = 'null';

/**
 * CRUD editor for null values.
 */
export default class NullEditor extends StandardEditor {
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
