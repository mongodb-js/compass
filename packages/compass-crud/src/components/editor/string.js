import chars from 'utils';
import StandardEditor from './standard';

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

  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size() {
    return chars(this.element.currentValue);
  }
}

export default StringEditor;
