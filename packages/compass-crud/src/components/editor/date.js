import moment from 'moment-timezone';
import TypeChecker from 'hadron-type-checker';
import { Element } from 'hadron-document';
import chars from 'utils';
import StandardEditor from './standard';

/**
 * The date format.
 */
const FORMAT = 'YYYY-MM-DD HH:mm:ss.SSSZ';

/**
 * CRUD editor for date values.
 */
class DateEditor extends StandardEditor {

  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   * @param {String} tz - Optional argument to set timezone.
   */
  constructor(element, tz) {
    super(element);
    this.tz = tz ? tz : 'UTC';
  }

  /**
   * Complete the date edit by converting the valid string to a date
   * object or leaving as invalid.
   */
  complete() {
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(TypeChecker.cast(this.element.currentValue, 'Date'));
    }
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value) {
    try {
      const date = TypeChecker.cast(value, 'Date');
      if (date.toString() === 'Invalid Date') {
        this.element.setInvalid(value, 'Date', `${value} is not in a valid date format`);
      } else {
        this.element.currentValue = value;
        this.element.setValid();
        this.element._bubbleUp(Element.Events.Edited);
      }
    } catch (e) {
      this.element.setInvalid(value, this.element.currentType, e.message);
    }
  }

  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size(editMode) {
    const value = this.element.currentValue;
    if (editMode) {
      return chars(value);
    }
    return this.element.isCurrentTypeValid() ? chars(this._formattedValue()) : chars(value);
  }

  /**
   * Start the date edit.
   *
   * @param {Object} value - The value in the field.
   */
  start() {
    if (this.element.isCurrentTypeValid()) {
      this.edit(this._formattedValue());
    }
  }

  /**
   * Get the value being edited.
   *
   * @param {Boolean} editMode - If the UI is in edit mode.
   *
   * @returns {String} The value.
   */
  value(editMode) {
    const value = this.element.currentValue;
    if (!editMode && this.element.isCurrentTypeValid()) {
      return this._formattedValue();
    }
    return value;
  }

  _formattedValue() {
    return moment(this.element.currentValue).tz(this.tz).format(FORMAT);
  }
}

export default DateEditor;
