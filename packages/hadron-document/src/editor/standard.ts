import type { TypeCastTypes } from 'hadron-type-checker';
import TypeChecker from 'hadron-type-checker';
import Events from '../element-events';
import type { BSONValue } from '../utils';
import { fieldStringLen } from '../utils';
import type Element from '../element';

/**
 * Regex to match an array or object string.
 */
const ARRAY_OR_OBJECT = /^(\[|\{)(.+)(\]|\})$/;

/**
 * CRUD editor for standard values.
 */
export default class StandardEditor {
  element: Element;
  type: TypeCastTypes;
  editing: boolean;

  /**
   * Create the editor with the element.
   *
   * @param {Element} element - The hadron document element.
   */
  constructor(element: Element) {
    this.element = element;
    this.type = element.currentType;
    this.editing = false;
  }

  /**
   * Edit the element with the provided value.
   *
   * @param {Object} value - The new value.
   */
  edit(value: BSONValue): void {
    const currentType = this.element.currentType;
    try {
      const newValue = TypeChecker.cast(value, currentType);
      this.element.edit(newValue);
    } catch (e: any) {
      this.element.setInvalid(value, currentType, e.message);
    }
  }

  /**
   * Edit the element via a paste.
   *
   * @param {String} value - The value.
   */
  paste(value: string): void {
    if (ARRAY_OR_OBJECT.exec(value)) {
      this.edit(JSON.parse(value));
      this.element._bubbleUp(Events.Converted, this.element);
    } else {
      this.edit(value);
    }
  }

  /**
   * Get the number of characters the value should display.
   *
   * @param {Boolean} editMode - If the element is being edited.
   *
   * @returns {Number} The number of characters.
   */
  size(): number {
    return fieldStringLen(this.element.currentValue);
  }

  /**
   * Get the value being edited. Always returns a string because this value will
   * always be used by browser input elements that operate on nothing but
   * strings
   *
   * @returns {string} The value.
   */
  value(): string {
    return String(this.element.currentValue);
  }

  // Standard editing requires no special start/complete behaviour.
  start(): void {
    this.editing = true;
  }

  complete(): void {
    this.editing = false;
  }
}
