import type { Element } from './element';

const DECRYPTED_KEYS = Symbol.for('@@mdb.decryptedKeys');

function maybeDecorateWithDecryptedKeys(
  object: Record<string, unknown> | unknown[],
  element: Element
) {
  if (element.isValueDecrypted()) {
    if (!(object as any)[DECRYPTED_KEYS]) {
      // non-enumerable object[DECRYPTED_KEYS] = []
      Object.defineProperty(object, DECRYPTED_KEYS, {
        value: [],
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }
    (object as any)[DECRYPTED_KEYS].push(String(element.currentKey));
  }
}

/**
 * Generates javascript objects from elements.
 */
export class ObjectGenerator {
  /**
   * Generate a javascript object from the elements.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Object} The javascript object.
   */
  static generate(elements: Iterable<Element>): Record<string, unknown> {
    if (elements) {
      const object: Record<string, unknown> = {};
      for (const element of elements) {
        if (!element.isRemoved() && element.currentKey !== '') {
          object[element.currentKey] = element.generateObject();
          maybeDecorateWithDecryptedKeys(object, element);
        }
      }
      return object;
    }
    return elements;
  }

  /**
   * Generate a javascript object from the elements with their original keys
   * and values. This can be used in a query with an update to
   * ensure the values on the document to edit are still up to date.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Object} The javascript object.
   */
  static generateOriginal(
    elements: Iterable<Element>
  ): Record<string, unknown> {
    if (elements) {
      const object: Record<string, unknown> = {};
      for (const element of elements) {
        if (!element.isAdded()) {
          object[element.key] = element.generateOriginalObject();
          maybeDecorateWithDecryptedKeys(object, element);
        }
      }
      return object;
    }
    return elements;
  }

  /**
   * Generate an array from the elements.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Array} The array.
   */
  static generateArray(elements: Iterable<Element>): unknown[] {
    if (elements) {
      const array: unknown[] = [];
      for (const element of elements) {
        if (!element.isRemoved()) {
          if (element.elements) {
            array.push(element.generateObject());
          } else {
            array.push(element.currentValue);
          }
          maybeDecorateWithDecryptedKeys(array, element);
        }
      }
      return array;
    }
    return elements;
  }

  /**
   * Generate an array from the elements using their original values.
   *
   * @param {Array} elements - The elements.
   *
   * @returns {Array} The array.
   */
  static generateOriginalArray(elements: Iterable<Element>): unknown[] {
    if (elements) {
      const array: unknown[] = [];
      for (const element of elements) {
        if (element.originalExpandableValue) {
          array.push(element.generateOriginalObject());
        } else if (!element.isAdded()) {
          array.push(element.value);
        }
        maybeDecorateWithDecryptedKeys(array, element);
      }
      return array;
    }
    return elements;
  }
}

export default ObjectGenerator;
