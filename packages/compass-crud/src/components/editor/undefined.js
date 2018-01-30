import StandardEditor from './standard';

/**
 * Undefined is always 'undefined'
 */
const VALUE = 'undefined';

/**
 * CRUD editor for undefined values.
 */
class UndefinedEditor extends StandardEditor {

  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }

  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size() {
    return 9;
  }

  /**
   * Get the value being edited.
   *
   * @returns {Object} The value.
   */
  value() {
    return VALUE;
  }
}

export default UndefinedEditor;
