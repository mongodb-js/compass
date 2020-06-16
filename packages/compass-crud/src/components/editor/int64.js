import TypeChecker from 'hadron-type-checker';
import { Element } from 'hadron-document';
import StandardEditor from './standard';
import chars from 'utils';

/**
 * CRUD editor for int32 values.
 */
class Int64Editor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element) {
    super(element);
  }

  /**
   * Complete the int64 edit by converting the valid string to a int64
   * value or leaving as invalid.
   */
  complete() {
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
  edit(value) {
    try {
      TypeChecker.cast(value, 'Int64');
      this.element.currentValue = value;
      this.element.setValid();
      this.element._bubbleUp(Element.Events.Edited);
    } catch (error) {
      this.element.setInvalid(value, this.element.currentType, error.message);
    }
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

  value() {
    return this.element.currentValue;
  }
}

export default Int64Editor;
