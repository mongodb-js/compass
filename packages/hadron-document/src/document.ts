'use strict';
import type { Element } from './element';
import { LinkedList, Events as ElementEvents } from './element';
import EventEmitter from 'eventemitter3';
import { UUID } from 'bson';
import ObjectGenerator from './object-generator';
import type { BSONObject, BSONValue } from './utils';

/**
 * The event constant.
 */
export const Events = {
  Cancel: 'Document::Cancel',
};

/**
 * The id field.
 */
const ID = '_id';

/**
 * Represents a document.
 */
export class Document extends EventEmitter {
  uuid: string;
  doc: BSONObject;
  cloned: boolean;
  isUpdatable: boolean;
  elements: LinkedList;
  type: 'Document' | 'Array';
  currentType: 'Document' | 'Array';

  /**
   * Send cancel event.
   */
  cancel(): void {
    // Cancel will remove elements from iterator, clone it before iterating
    // otherwise we will skip items
    for (const element of Array.from(this.elements)) {
      element.cancel();
    }
    this.emit(Events.Cancel);
  }

  /**
   * Create the new document from the provided object.
   *
   * @param {Object} doc - The document.
   * @param {boolean} cloned - If it is a cloned document.
   */
  constructor(doc: BSONObject, cloned = false) {
    super();
    this.uuid = new UUID().toHexString();
    this.doc = doc;
    this.cloned = cloned || false;
    this.isUpdatable = true;
    this.elements = this._generateElements();
    this.type = 'Document';
    this.currentType = 'Document';
  }

  apply(doc: BSONObject): void {
    const updatedKeys: (string | number)[] = [];
    let prevKey = null;
    for (const [key, value] of Object.entries(doc)) {
      if (this.get(key)) {
        this.get(key)!.edit(value as BSONValue);
      } else if (prevKey) {
        this.insertAfter(this.get(prevKey)!, key, value as BSONValue);
      } else {
        this.insertBeginning(key, value as BSONValue);
      }
      prevKey = key;
      updatedKeys.push(key);
    }
    for (const el of [...this.elements]) {
      if (!updatedKeys.includes(el.currentKey)) {
        el.remove();
      }
    }
  }

  /**
   * Generate the javascript object for this document.
   *
   * @returns {Object} The javascript object.
   */
  generateObject(): BSONObject {
    return ObjectGenerator.generate(this.elements);
  }

  /**
   * Generate the javascript object with the original elements in this document.
   *
   * @returns {Object} The original javascript object.
   */
  generateOriginalObject(): BSONObject {
    return ObjectGenerator.generateOriginal(this.elements);
  }

  /**
   * Generate the `query` and `updateDoc` to be used in an update operation
   * where the update only succeeds when the changed document's elements have
   * not been changed in the background.
   *
   * @param {Object} alwaysIncludeKeys - An object whose keys are used as keys
   *     that are always included in the generated query.
   *
   * @returns {Object} An object containing the `query` and `updateDoc` to be
   * used in an update operation.
   */
  generateUpdateUnlessChangedInBackgroundQuery(
    alwaysIncludeKeys: BSONObject | null = null
  ): {
    query: BSONObject;
    updateDoc: { $set?: BSONObject; $unset?: BSONObject };
  } {
    // Build a query that will find the document to update only if it has the
    // values of elements that were changed with their original value.
    // This query won't find the document if an updated element's value isn't
    // the same value as it was when it was originally loaded.
    const originalFieldsThatWillBeUpdated =
      this.getOriginalKeysAndValuesForFieldsThatWereUpdated(alwaysIncludeKeys);
    const query = {
      _id: this.getId(),
      ...originalFieldsThatWillBeUpdated,
    };

    // Build the update document to be used in an update operation with `$set`
    // and `$unset` reflecting the changes that have occured in the document.
    const setUpdateObject = this.getSetUpdateForDocumentChanges();
    const unsetUpdateObject = this.getUnsetUpdateForDocumentChanges();
    const updateDoc: { $set?: BSONObject; $unset?: BSONObject } = {};
    if (setUpdateObject && Object.keys(setUpdateObject).length > 0) {
      updateDoc.$set = setUpdateObject;
    }
    if (unsetUpdateObject && Object.keys(unsetUpdateObject).length > 0) {
      updateDoc.$unset = unsetUpdateObject;
    }

    return {
      query,
      updateDoc,
    };
  }

  /**
   * Get an element by its key.
   *
   * @param {String} key
   *
   * @returns {Element} The element.
   */
  get(key: string): Element | undefined {
    return this.elements.get(key);
  }

  /**
   * Get an element by a series of segment names.
   *
   * @param {Array} path - The series of fieldnames. Cannot be empty.
   *
   * @returns {Element} The element.
   */
  getChild(path: (string | number)[]): Element | undefined {
    if (!path) {
      return undefined;
    }
    let element =
      this.currentType === 'Array'
        ? this.elements.at(path[0] as number)
        : this.elements.get(path[0] as string);
    let i = 1;
    while (i < path.length) {
      if (element === undefined) {
        return undefined;
      }
      element =
        element.currentType === 'Array'
          ? element.at(path[i] as number)
          : element.get(path[i] as string);
      i++;
    }
    return element;
  }

  /**
   * Get the _id value for the document.
   *
   * @returns {Object} The id.
   */
  getId(): BSONValue {
    const element = this.get(ID);
    return element ? element.generateObject() : null;
  }

  /**
   * Generate the query javascript object reflecting the elements that
   * were updated in this document. The values of this object are the original
   * values, this can be used when querying for an update to see if the original
   * document was changed in the background while it was being updated elsewhere.
   *
   * @param {Object} alwaysIncludeKeys - An object whose keys are used as keys
   *     that are always included in the generated query.
   *
   * @returns {Object} The javascript object.
   */
  getOriginalKeysAndValuesForFieldsThatWereUpdated(
    alwaysIncludeKeys: BSONObject | null = null
  ): BSONObject {
    const object: BSONObject = {};

    if (this.elements) {
      for (const element of this.elements) {
        if (
          (element.isModified() && !element.isAdded()) ||
          (alwaysIncludeKeys && element.key in alwaysIncludeKeys)
        ) {
          // Using `.key` instead of `.currentKey` to ensure we look at
          // the original field's value.
          object[element.key] = element.generateOriginalObject();
        }
        if (element.isAdded() && element.currentKey !== '') {
          // When a new field is added, check if that field
          // was already added in the background.
          object[element.currentKey] = { $exists: false };
        }
      }
    }

    return object;
  }

  /**
   * Generate the query javascript object reflecting the elements that
   * are specified by the keys listed in `keys`. The values of this object are
   * the original values, this can be used when querying for an update based
   * on multiple criteria.
   *
   * @param {Object} keys - An object whose keys are used as keys
   *     that are included in the generated query.
   *
   * @returns {Object} The javascript object.
   */
  getOriginalKeysAndValuesForSpecifiedKeys(keys: BSONObject): BSONObject {
    const object: BSONObject = {};

    if (this.elements) {
      for (const element of this.elements) {
        if (element.key in keys) {
          // Using `.key` instead of `.currentKey` to ensure we look at
          // the original field's value.
          object[element.key] = element.generateOriginalObject();
        }
      }
    }

    return object;
  }

  /**
   * Generate an $set javascript object, that can be used in update operations to
   * set the changes which have occured in the document since it was loaded.
   *
   * @returns {Object} The javascript update object.
   **/
  getSetUpdateForDocumentChanges(): BSONObject {
    const object: BSONObject = {};

    if (this.elements) {
      for (const element of this.elements) {
        if (
          !element.isRemoved() &&
          element.currentKey !== '' &&
          element.isModified()
        ) {
          // Include the full modified element.
          // We don't individually set nested fields because we can't guarantee a
          // path to the element using '.' dot notation will update
          // the correct field, because field names can contain dots as of 3.6.
          // When a nested field has been altered (changed/added/removed) it is
          // set at the top level field. This means we overwrite possible
          // background changes that occur within sub documents.
          object[element.currentKey] = element.generateObject();
        }
      }
    }
    return object;
  }

  /**
   * Get the _id value as a string. Required if _id is not always an ObjectId.
   *
   * @returns {String} The string id.
   */
  getStringId(): null | string {
    const element = this.get(ID);
    if (!element) {
      return null;
    } else if (
      element.currentType === 'Array' ||
      element.currentType === 'Object'
    ) {
      return JSON.stringify(element.generateObject());
    }
    return String(element.value);
  }

  /**
   * Generate an $unset javascript object, that can be used in update
   * operations, with the removals from the document.
   *
   * @returns {Object} The javascript update object.
   **/
  getUnsetUpdateForDocumentChanges(): BSONObject {
    const object: BSONObject = {};

    if (this.elements) {
      for (const element of this.elements) {
        if (!element.isAdded() && element.isRemoved() && element.key !== '') {
          object[element.key] = true;
        }
        if (!element.isAdded() && element.isRenamed() && element.key !== '') {
          // Remove the original field when an element is renamed.
          object[element.key] = true;
        }
      }
    }
    return object;
  }

  /**
   * Insert a placeholder element at the end of the document.
   *
   * @returns {Element} The placeholder element.
   */
  insertPlaceholder(): Element {
    return this.insertEnd('', '');
  }

  /**
   * Add a new element to this document.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertBeginning(key: string | number, value: BSONValue): Element {
    const newElement = this.elements.insertBeginning(key, value, true, this);
    newElement._bubbleUp(ElementEvents.Added, newElement, this);
    return newElement;
  }

  /**
   * Add a new element to this document.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertEnd(key: string | number, value: BSONValue): Element {
    const newElement = this.elements.insertEnd(key, value, true, this);
    newElement._bubbleUp(ElementEvents.Added, newElement, this);
    return newElement;
  }

  /**
   * Insert an element after the provided element.
   *
   * @param {Element} element - The element to insert after.
   * @param {String} key - The key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertAfter(
    element: Element,
    key: string | number,
    value: BSONValue
  ): Element {
    const newElement = this.elements.insertAfter(
      element,
      key,
      value,
      true,
      this
    );
    newElement._bubbleUp(ElementEvents.Added, newElement, this);
    return newElement;
  }

  /**
   * A document always exists, is never added.
   *
   * @returns {false} Always false.
   */
  isAdded(): boolean {
    return false;
  }

  /**
   * Determine if the element is modified at all.
   *
   * @returns {Boolean} If the element is modified.
   */
  isModified(): boolean {
    for (const element of this.elements) {
      if (element.isModified()) {
        return true;
      }
    }
    return false;
  }

  /**
   * A document is never removed
   *
   * @returns {false} Always false.
   */
  isRemoved(): boolean {
    return false;
  }

  /**
   * The document object is always the root object.
   *
   * @returns {true} Always true.
   */
  isRoot(): this is Document {
    return true;
  }

  /**
   * Handle the next element in the document.
   */
  next(): void {
    this.elements.flush();
    const lastElement = this.elements.lastElement;
    if (lastElement && lastElement.isAdded()) {
      if (lastElement.isBlank()) {
        lastElement.remove();
      } else {
        this.insertPlaceholder();
      }
    } else {
      this.insertPlaceholder();
    }
  }

  /**
   * Generates a sequence of elements.
   *
   * @returns {Array} The elements.
   */
  _generateElements(): LinkedList {
    return new LinkedList(this, this.doc);
  }

  /**
   * @deprecated Use DocumentEvents import instead
   */
  static get Events(): typeof Events {
    return Events;
  }
}

export default Document;
