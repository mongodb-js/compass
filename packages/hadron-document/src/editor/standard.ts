import type { TypeCastTypes } from 'hadron-type-checker';
import TypeChecker from 'hadron-type-checker';
import { ElementEvents } from '../element-events';
import type { BSONValue } from '../utils';
import { fieldStringLen } from '../utils';
import type { Element } from '../element';

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
  displayType: TypeCastTypes;
  editing: boolean;
  private valueAtEditStart?: { value: BSONValue };

  /**
   * Create the editor with the element.
   *
   * @param element - The hadron document element.
   */
  constructor(element: Element, displayType?: TypeCastTypes) {
    this.element = element;
    this.type = element.currentType;
    this.displayType = displayType ?? element.currentType;
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
      this.element._bubbleUp(ElementEvents.Converted, this.element);
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

  /**
   * Start an edit session, remembering the value it starts from so that
   * `complete` can tell whether the value actually changed. Subclasses that
   * convert their value into an editable form do so before calling `super`, so
   * that the conversion is not itself counted as an edit; correspondingly they
   * call `super.complete()` before converting back.
   */
  start(): void {
    this.editing = true;
    this.valueAtEditStart = { value: this.element.currentValue };
  }

  /**
   * Complete the edit session, emitting `EditCompleted` if the value changed
   * over the course of it. This lets consumers observe a whole edit instead of
   * every intermediate `Edited` event a single edit produces.
   */
  complete(): void {
    this.editing = false;
    const valueAtEditStart = this.valueAtEditStart;
    this.valueAtEditStart = undefined;
    if (
      valueAtEditStart &&
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      String(valueAtEditStart.value) !== String(this.element.currentValue)
    ) {
      this.element._bubbleUp(ElementEvents.EditCompleted, this.element);
    }
  }
}
