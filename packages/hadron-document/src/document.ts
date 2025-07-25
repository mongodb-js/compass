'use strict';
import type { Element, ElementEventsType } from './element';
import { ElementList } from './element';
import EventEmitter from 'eventemitter3';
import { EJSON, UUID } from 'bson';
import type {
  KeyInclusionOptions,
  ObjectGeneratorOptions,
} from './object-generator';
import ObjectGenerator from './object-generator';
import type { BSONArray, BSONObject, BSONValue } from './utils';
import { objectToIdiomaticEJSON } from './utils';
import type { HadronEJSONOptions } from './utils';
import type { Binary, MongoServerError } from 'mongodb';
import { DocumentEvents, type DocumentEventsType } from './document-events';
import { ElementEvents } from './element-events';

/**
 * The id field.
 */
const ID = '_id';

export const DEFAULT_VISIBLE_ELEMENTS = 25;

/**
 * Represents a document.
 */
export class Document extends EventEmitter<
  DocumentEventsType | ElementEventsType
> {
  uuid: string;
  doc: BSONObject;
  cloned: boolean;
  isUpdatable: boolean;
  elements: ElementList;
  type: 'Document';
  currentType: 'Document';
  size: number | null = null;
  expanded = false;
  maxVisibleElementsCount = DEFAULT_VISIBLE_ELEMENTS;
  editing = false;
  markedForDeletion = false;
  // This is used to store the changed EJSON string when the document is modified
  // via the JSONEditor.
  modifiedEJSONString: string | null = null;

  /**
   * Send cancel event.
   */
  cancel(): void {
    // Cancel will remove elements from iterator, clone it before iterating
    // otherwise we will skip items
    for (const element of Array.from(this.elements)) {
      element.cancel();
    }
    this.emit(DocumentEvents.Cancel);
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
    this.type = 'Document';
    this.currentType = 'Document';
    this.elements = this._generateElements();
  }

  apply(doc: BSONObject | Document): void {
    if (typeof doc?.generateObject === 'function') {
      doc = doc.generateObject();
    }
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

  preserveTypes(other: Document): void {
    const thisDoc = this.generateObject();

    for (const key of Object.keys(thisDoc)) {
      const thisElement = this.get(key);
      const otherElement = other.get(key);
      if (!thisElement || !otherElement) {
        continue;
      }

      thisElement.preserveType(otherElement);
    }
  }

  /**
   * Generate the javascript object for this document.
   *
   * @returns {Object} The javascript object.
   */
  generateObject(options?: ObjectGeneratorOptions): BSONObject {
    return ObjectGenerator.generate(this.elements, options);
  }

  /**
   * Generate the javascript object with the original elements in this document.
   *
   * @returns {Object} The original javascript object.
   */
  generateOriginalObject(options?: ObjectGeneratorOptions): BSONObject {
    return ObjectGenerator.generateOriginal(this.elements, options);
  }

  /**
   * Generate the `query` and `updateDoc` to be used in an update operation
   * where the update only succeeds when the changed document's elements have
   * not been changed in the background.
   *
   * `query` and `updateDoc` may use $getField and $setField if field names
   * contain either `.` or start with `$`. These operators are only available
   * on MongoDB 5.0+. (Note that field names starting with `$` are also only
   * allowed in MongoDB 5.0+.)
   *
   * @param keyInclusionOptions Specify which fields to include in the
   *     originalFields list.
   *
   * @returns {Object} An object containing the `query` and `updateDoc` to be
   * used in an update operation.
   */
  generateUpdateUnlessChangedInBackgroundQuery(
    opts: Readonly<KeyInclusionOptions> = {}
  ): {
    query: BSONObject;
    updateDoc: { $set?: BSONObject; $unset?: BSONObject } | BSONArray;
  } {
    // Build a query that will find the document to update only if it has the
    // values of elements that were changed with their original value.
    // This query won't find the document if an updated element's value isn't
    // the same value as it was when it was originally loaded.
    const originalFieldsThatWillBeUpdated =
      ObjectGenerator.getQueryForOriginalKeysAndValuesForSpecifiedFields(
        this,
        opts,
        true
      );
    const query = {
      _id: this.getId(),
      ...originalFieldsThatWillBeUpdated,
    };

    const updateDoc = ObjectGenerator.generateUpdateDoc(this);

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
    let element = this.elements.get(path[0] as string);
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
   * are specified by the keys listed in `keys`. The values of this object are
   * the original values, this can be used when querying for an update based
   * on multiple criteria.
   *
   * @param keyInclusionOptions Specify which fields to include in the
   *     originalFields list.
   *
   * @returns {Object} The javascript object.
   */
  getQueryForOriginalKeysAndValuesForSpecifiedKeys(
    opts: Readonly<KeyInclusionOptions> = {}
  ): BSONObject {
    return ObjectGenerator.getQueryForOriginalKeysAndValuesForSpecifiedFields(
      this,
      opts,
      false
    );
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
    const newElement = this.elements.insertBeginning(key, value);
    newElement._bubbleUp(ElementEvents.Added, newElement, this);
    this.emit(DocumentEvents.VisibleElementsChanged, this);
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
    const newElement = this.elements.insertEnd(key, value);
    newElement._bubbleUp(ElementEvents.Added, newElement, this);
    this.emit(DocumentEvents.VisibleElementsChanged, this);
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
  ): Element | undefined {
    const newElement = this.elements.insertAfter(element, key, value);
    newElement?._bubbleUp(ElementEvents.Added, newElement, this);
    this.emit(DocumentEvents.VisibleElementsChanged, this);
    return newElement;
  }

  /**
   * A document always exists, is never added.
   *
   * @returns Always false.
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
   * Generates a sequence of elements.
   *
   * @returns {Array} The elements.
   */
  _generateElements(): ElementList {
    return new ElementList(this, this.doc);
  }

  /**
   * @deprecated Use DocumentEvents import instead
   */
  static get Events(): typeof DocumentEvents {
    return DocumentEvents;
  }

  /**
   * Parse a new Document from extended JSON input.
   */
  static FromEJSON(input: string): Document {
    const parsed = EJSON.parse(input, { relaxed: false });
    return new Document(parsed as BSONObject);
  }

  /**
   * Parse multiple Document from extended JSON input.
   * If the input consists of only a single document without
   * `[array]` brackets, return an array consisting of only
   * that document.
   */
  static FromEJSONArray(input: string): Document[] {
    const parsed = EJSON.parse(input, { relaxed: false });
    return Array.isArray(parsed)
      ? parsed.map((doc) => new Document(doc as BSONObject))
      : [new Document(parsed as BSONObject)];
  }

  /**
   * Convert this Document instance into a human-readable EJSON string.
   */
  toEJSON(
    source: 'original' | 'current' = 'current',
    options: HadronEJSONOptions = {}
  ): string {
    const obj =
      source === 'original'
        ? this.generateOriginalObject()
        : this.generateObject();
    return objectToIdiomaticEJSON(obj, options);
  }

  /**
   * Expands a document by expanding all of its fields
   */
  expand(): void {
    this.expanded = true;
    for (const element of this.elements) {
      element.expand(true);
    }
    this.emit(DocumentEvents.Expanded);
    this.emit(DocumentEvents.VisibleElementsChanged, this);
  }

  /**
   * Collapses a document by collapsing all of its fields
   */
  collapse(): void {
    this.expanded = false;
    for (const element of this.elements) {
      element.collapse();
    }
    this.emit(DocumentEvents.Collapsed);
    this.emit(DocumentEvents.VisibleElementsChanged, this);
  }

  getVisibleElements() {
    return [...this.elements].slice(0, this.maxVisibleElementsCount);
  }

  setMaxVisibleElementsCount(newCount: number) {
    this.maxVisibleElementsCount = newCount;
    this.emit(DocumentEvents.VisibleElementsChanged, this);
  }

  getTotalVisibleElementsCount() {
    const visibleElements = this.getVisibleElements();
    return visibleElements.reduce((totalVisibleChildElements, element) => {
      return (
        totalVisibleChildElements + 1 + element.getTotalVisibleElementsCount()
      );
    }, 0);
  }

  findUUIDs() {
    let subtype4Count = 0;
    let subtype3Count = 0;
    for (const element of this.elements) {
      if (element.currentType === 'Binary') {
        if ((element.value as Binary).sub_type === 4) {
          subtype4Count++;
        }
        if ((element.value as Binary).sub_type === 3) {
          subtype3Count++;
        }
      } else if (
        element.currentType === 'Object' ||
        element.currentType === 'Array'
      ) {
        const { subtype3Count: sub3, subtype4Count: sub4 } =
          element.findUUIDs();
        subtype3Count += sub3;
        subtype4Count += sub4;
      }
    }
    return { subtype3Count, subtype4Count };
  }

  startEditing(elementId?: string, field?: 'key' | 'value' | 'type'): void {
    if (!this.editing) {
      this.editing = true;
      this.emit(DocumentEvents.EditingStarted, elementId, field);
    }
  }

  finishEditing() {
    if (this.editing) {
      this.editing = false;
      this.setModifiedEJSONString(null);
      this.emit(DocumentEvents.EditingFinished);
    }
  }

  onUpdateStart() {
    this.emit(DocumentEvents.UpdateStarted);
  }

  onUpdateSuccess(doc: Record<string, unknown>) {
    this.emit(DocumentEvents.UpdateSuccess, doc);
    this.finishEditing();
  }

  onUpdateBlocked() {
    this.emit(DocumentEvents.UpdateBlocked);
  }

  onUpdateError(error: Error) {
    this.emit(
      DocumentEvents.UpdateError,
      error,
      (error as MongoServerError).errInfo
    );
  }

  markForDeletion() {
    if (!this.markedForDeletion) {
      this.markedForDeletion = true;
      this.emit(DocumentEvents.MarkedForDeletion);
    }
  }

  finishDeletion() {
    if (this.markedForDeletion) {
      this.markedForDeletion = false;
      this.emit(DocumentEvents.DeletionFinished);
    }
  }

  onRemoveStart() {
    this.emit(DocumentEvents.RemoveStarted);
  }

  onRemoveSuccess() {
    this.emit(DocumentEvents.RemoveSuccess);
    this.finishDeletion();
  }

  onRemoveError(error: Error) {
    this.emit(
      DocumentEvents.RemoveError,
      error,
      (error as MongoServerError).errInfo
    );
  }

  setModifiedEJSONString(ejson: string | null) {
    this.modifiedEJSONString = ejson;
  }
}
