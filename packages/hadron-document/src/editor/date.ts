import TypeChecker from 'hadron-type-checker';
import Events from '../element-events';
import type { BSONValue } from '../utils';
import { fieldStringLen } from '../utils';
import StandardEditor from './standard';
import type Element from '../element';

/**
 * CRUD editor for date values.
 */
export default class DateEditor extends StandardEditor {
  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element: Element) {
    super(element);
  }

  /**
   * Complete the date edit by converting the valid string to a date
   * object or leaving as invalid.
   */
  complete(): void {
    super.complete();
    if (this.element.isCurrentTypeValid()) {
      this.element.edit(TypeChecker.cast(this._formattedValue(), 'Date'));
    }
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value: BSONValue): void {
    try {
      const date = TypeChecker.cast(value, 'Date');
      if (date.toString() === 'Invalid Date') {
        this.element.setInvalid(
          value,
          'Date',
          `${String(value)} is not in a valid date format`
        );
      } else {
        this.element.currentValue = value;
        this.element.setValid();
        this.element._bubbleUp(Events.Edited, this.element);
      }
    } catch (e: any) {
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
  size(editMode?: boolean): number {
    const value = this.element.currentValue;
    if (editMode) {
      return fieldStringLen(value);
    }
    return this.element.isCurrentTypeValid()
      ? fieldStringLen(this._formattedValue())
      : fieldStringLen(value);
  }

  /**
   * Start the date edit.
   *
   * @param {Object} value - The value in the field.
   */
  start(): void {
    super.start();
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
  value(): string {
    const value = this.element.currentValue;
    if (!this.editing && this.element.isCurrentTypeValid()) {
      return this._formattedValue();
    }
    return String(value);
  }

  _formattedValue(): string {
    return new Date(this.element.currentValue as any)
      .toISOString()
      .replace('Z', '+00:00');
  }
}
