'use strict';

import EventEmitter from 'eventemitter3';
import keys from 'lodash.keys';
import isObject from 'lodash.isplainobject';
import isArray from 'lodash.isarray';
import isEqual from 'lodash.isequal';
import isString from 'lodash.isstring';
import ObjectGenerator from './object-generator';
import TypeChecker from 'hadron-type-checker';
import { UUID } from 'bson';
import DateEditor from './editor/date';
import Events from './element-events';
import type Document from './document';
import type { TypeCastTypes } from 'hadron-type-checker';
import type { ObjectId } from 'bson';
import type { BSONArray, BSONObject, BSONValue } from './utils';
import { ElementEvents } from '.';

export const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
export { Events };

/**
 * Id field constant.
 */
const ID = '_id';

/**
 * __safeContent__ field constant.
 */
const SAFE_CONTENT_FIELD = '__safeContent__';

/**
 * Types that are not editable.
 */
const UNEDITABLE_TYPES = [
  'Binary',
  'Code',
  'MinKey',
  'MaxKey',
  'Timestamp',
  'BSONRegExp',
  'Undefined',
  'Null',
  'DBRef',
];

/**
 * Curly brace constant.
 */
const CURLY = '{';

/**
 * Bracket constant.
 */
const BRACKET = '[';

/**
 * Regex to match an array or object string.
 */
const ARRAY_OR_OBJECT = /^(\[|\{)(.+)(\]|\})$/;

/**
 * Represents an element in a document.
 */
export class Element extends EventEmitter {
  uuid: string;
  key: string | number;
  currentKey: string | number;
  value: BSONValue;
  currentValue: BSONValue;
  added: boolean;
  removed: boolean;
  elements?: LinkedList | null;
  originalExpandableValue?: BSONObject | BSONArray;
  parent: Element | Document | null;
  previousElement: Element | null;
  nextElement: Element | null;
  type: TypeCastTypes;
  currentType: TypeCastTypes;
  level: number;
  currentTypeValid?: boolean;
  invalidTypeMessage?: string;
  decrypted: boolean;

  /**
   * Bulk edit the element. Can accept JSON strings.
   *
   * @param {String} value - The JSON string value.
   */
  bulkEdit(value: string): void {
    if (ARRAY_OR_OBJECT.exec(value)) {
      this.edit(JSON.parse(value));
      this._bubbleUp(Events.Converted, this);
    } else {
      this.edit(value);
    }
  }

  /**
   * Cancel any modifications to the element.
   */
  cancel(): void {
    if (this.elements) {
      // Cancel will remove elements from iterator, clone it before iterating
      // otherwise we will skip items
      for (const element of Array.from(this.elements)) {
        element.cancel();
      }
    }
    if (this.isModified()) {
      this.revert();
    }
  }

  /**
   * Create the element.
   *
   * @param {String} key - The key.
   * @param {Object} value - The value.
   * @param {Boolean} added - Is the element a new 'addition'?
   * @param {Element|Document} parent - The parent element.
   * @param {Element} previousElement - The previous element in the list.
   * @param {Element} nextElement - The next element in the list.
   */
  constructor(
    key: string | number,
    value: BSONValue,
    added = false,
    parent: Element | Document | null = null,
    previousElement: Element | null = null,
    nextElement: Element | null = null
  ) {
    super();
    this.uuid = new UUID().toHexString();
    this.key = key;
    this.currentKey = key;
    this.parent = parent;
    this.previousElement = previousElement;
    this.nextElement = nextElement;
    this.added = added;
    this.removed = false;
    this.type = TypeChecker.type(value);
    this.currentType = this.type;
    this.level = this._getLevel();
    this.setValid();

    if (this._isExpandable(value)) {
      this.elements = this._generateElements(value);
      this.originalExpandableValue = value;
    } else {
      this.value = value;
      this.currentValue = value;
    }

    // The AutoEncrypter marks decrypted entries in a document
    // for us with a special symbol. We opt into this behavior
    // in the devtools-connect package.
    let parentValue;
    if (this.parent) {
      parentValue = this.parent.isRoot()
        ? this.parent.doc
        : this.parent.originalExpandableValue;
    }
    const parentDecryptedKeys =
      parentValue && (parentValue as any)[Symbol.for('@@mdb.decryptedKeys')];
    this.decrypted = (parentDecryptedKeys || [])
      .map(String)
      .includes(String(key));
  }

  _getLevel(): number {
    let level = -1;
    let parent = this.parent;
    while (parent) {
      level++;
      parent = (parent as Element).parent;
    }
    return level;
  }

  /**
   * Edit the element.
   *
   * @param {Object} value - The new value.
   */
  edit(value: BSONValue): void {
    this.currentType = TypeChecker.type(value);
    if (this._isExpandable(value) && !this._isExpandable(this.currentValue)) {
      this.currentValue = null;
      this.elements = this._generateElements(value);
    } else if (!this._isExpandable(value) && this.elements) {
      this.currentValue = value;
      this.elements = undefined;
    } else {
      this.currentValue = value;
    }
    this.setValid();
    this._bubbleUp(Events.Edited, this);
  }

  changeType(newType: TypeCastTypes): void {
    if (newType === 'Object') {
      this.edit('{');
      this.next();
    } else if (newType === 'Array') {
      this.edit('[');
      this.next();
    } else {
      try {
        if (newType === 'Date') {
          const editor = new DateEditor(this);
          editor.edit(this.generateObject());
          editor.complete();
        } else {
          this.edit(TypeChecker.cast(this.generateObject(), newType));
        }
      } catch (e: any) {
        this.setInvalid(this.currentValue, newType, e.message);
      }
    }
  }

  getRoot(): Document {
    let parent = this.parent;
    while ((parent as Element)?.parent) {
      parent = (parent as Element).parent;
    }
    return parent as Document;
  }

  /**
   * Get an element by its key.
   *
   * @param {String} key - The key name.
   *
   * @returns {Element} The element.
   */
  get(key: string | number): Element | undefined {
    return this.elements ? this.elements.get(key) : undefined;
  }

  /**
   * Get an element by its index.
   *
   * @param {Number} i - The index.
   *
   * @returns {Element} The element.
   */
  at(i: number): Element | undefined {
    return this.elements ? this.elements.at(i) : undefined;
  }

  /**
   * Go to the next edit.
   *
   * Will check if the value is either { or [ and take appropriate action.
   */
  next(): void {
    if (this.currentValue === CURLY) {
      return this._convertToEmptyObject();
    } else if (this.currentValue === BRACKET) {
      return this._convertToEmptyArray();
    }
    return this._next();
  }

  /**
   * Rename the element. Update the parent's mapping if available.
   *
   * @param {String} key - The new key.
   */
  rename(key: string | number): void {
    if (this.parent) {
      const elm = this.parent.elements!._map[this.currentKey];
      delete this.parent.elements!._map[this.currentKey];
      this.parent.elements!._map[key] = elm;
    }

    this.currentKey = key;
    this._bubbleUp(Events.Edited, this);
  }

  /**
   * Generate the javascript object for this element.
   *
   * @returns {Object} The javascript object.
   */
  generateObject(): BSONValue {
    if (this.currentType === 'Array') {
      return ObjectGenerator.generateArray(this.elements!);
    }
    if (this.currentType === 'Object') {
      return ObjectGenerator.generate(this.elements!);
    }
    return this.currentValue;
  }

  /**
   * Generate the javascript object representing the original values
   * for this element (pre-element removal, renaming, editing).
   *
   * @returns {Object} The javascript object.
   */
  generateOriginalObject(): BSONValue {
    if (this.type === 'Array') {
      const originalElements = this._generateElements(
        this.originalExpandableValue as BSONArray
      );
      return ObjectGenerator.generateOriginalArray(originalElements);
    }
    if (this.type === 'Object') {
      const originalElements = this._generateElements(
        this.originalExpandableValue as BSONObject
      );
      return ObjectGenerator.generateOriginal(originalElements);
    }

    return this.value;
  }

  /**
   * Insert an element after the provided element. If this element is an array,
   * then ignore the key specified by the caller and use the correct index.
   * Update the keys of the rest of the elements in the LinkedList.
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
    if (!this.elements) {
      throw new Error('Cannot insert values on non-array/non-object elements');
    }
    if (this.currentType === 'Array') {
      if (element.currentKey === '') {
        this.elements.handleEmptyKeys(element);
      }
      key = (element.currentKey as number) + 1;
    }
    const newElement = this.elements.insertAfter(
      element,
      key,
      value,
      true,
      this
    );
    if (this.currentType === 'Array') {
      this.elements.updateKeys(newElement, 1);
    }
    newElement._bubbleUp(Events.Added, newElement, this);
    return newElement;
  }

  /**
   * Add a new element to this element.
   *
   * @param {String | Number} key - The element key.
   * @param {Object} value - The value.
   *
   * @returns {Element} The new element.
   */
  insertEnd(key: string | number, value: BSONValue): Element {
    if (!this.elements) {
      throw new Error('Cannot insert values on non-array/non-object elements');
    }
    if (this.currentType === 'Array') {
      this.elements.flush();
      key = 0;
      if (this.elements.lastElement) {
        if (this.elements.lastElement.currentKey === '') {
          this.elements.handleEmptyKeys(this.elements.lastElement);
        }
        key = (this.elements.lastElement.currentKey as number) + 1;
      }
    }
    const newElement = this.elements.insertEnd(key, value, true, this);
    this._bubbleUp(Events.Added, newElement);
    return newElement;
  }

  /**
   * Insert a placeholder element at the end of the element.
   *
   * @returns {Element} The placeholder element.
   */
  insertPlaceholder(): Element {
    return this.insertEnd('', '');
  }

  insertSiblingPlaceholder(): Element {
    return this.parent!.insertAfter(this, '', '');
  }

  /**
   * Is the element a newly added element?
   *
   * @returns {Boolean} If the element is newly added.
   */
  isAdded(): boolean {
    return this.added || !!this.parent?.isAdded();
  }

  /**
   * Is the element blank?
   *
   * @returns {Boolean} If the element is blank.
   */
  isBlank(): boolean {
    return this.currentKey === '' && this.currentValue === '';
  }

  /**
   * Does the element have a valid value for the current type?
   *
   * @returns {Boolean} If the value is valid.
   */
  isCurrentTypeValid(): boolean {
    return !!this.currentTypeValid;
  }

  /**
   * Set the element as valid.
   */
  setValid(): void {
    this.currentTypeValid = true;
    this.invalidTypeMessage = undefined;
    this._bubbleUp(Events.Valid, this);
  }

  /**
   * Set the element as invalid.
   *
   * @param {Object} value - The value.
   * @param {String} newType - The new type.
   * @param {String} message - The error message.
   */
  setInvalid(value: BSONValue, newType: TypeCastTypes, message: string): void {
    this.currentValue = value;
    this.currentType = newType;
    this.currentTypeValid = false;
    this.invalidTypeMessage = message;
    this._bubbleUp(Events.Invalid, this);
  }

  /**
   * Determine if the key is a duplicate.
   *
   * @param {String} value - The value to check.
   *
   * @returns {Boolean} If the key is a duplicate.
   */
  isDuplicateKey(value: string | number): boolean {
    if (value === '') {
      return false;
    }
    for (const element of this.parent?.elements ?? []) {
      if (element.uuid !== this.uuid && element.currentKey === value) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determine if the element is edited - returns true if
   * the key or value changed. Does not count array values whose keys have
   * changed as edited.
   *
   * @returns {Boolean} If the element is edited.
   */
  isEdited(): boolean {
    return (
      (this.isRenamed() ||
        !this._valuesEqual() ||
        this.type !== this.currentType) &&
      !this.isAdded()
    );
  }

  /**
   * Check for value equality.

   * @returns {Boolean} If the value is equal.
   */
  _valuesEqual(): boolean {
    if (this.currentType === 'Date' && isString(this.currentValue)) {
      return isEqual(this.value, new Date(this.currentValue));
    } else if (this.currentType === 'ObjectId' && isString(this.currentValue)) {
      return this._isObjectIdEqual();
    }
    return isEqual(this.value, this.currentValue);
  }

  _isObjectIdEqual(): boolean {
    try {
      return (this.value as ObjectId).toHexString() === this.currentValue;
    } catch (_) {
      return false;
    }
  }

  /**
   * Is the element the last in the elements.
   *
   * @returns {Boolean} If the element is last.
   */
  isLast(): boolean {
    return this.parent?.elements?.lastElement === this;
  }

  /**
   * Determine if the element is renamed.
   *
   * @returns {Boolean} If the element was renamed.
   */
  isRenamed(): boolean {
    let keyChanged = false;
    if (
      !this.parent ||
      this.parent.isRoot() ||
      this.parent.currentType === 'Object'
    ) {
      keyChanged = this.key !== this.currentKey;
    }
    return keyChanged;
  }

  /**
   * Can changes to the elemnt be reverted?
   *
   * @returns {Boolean} If the element can be reverted.
   */
  isRevertable(): boolean {
    return this.isEdited() || this.isRemoved();
  }

  /**
   * Can the element be removed?
   *
   * @returns {Boolean} If the element can be removed.
   */
  isRemovable(): boolean {
    return !this.parent!.isRemoved();
  }

  /**
   * Can no action be taken on the element?
   *
   * @returns {Boolean} If no action can be taken.
   */
  isNotActionable(): boolean {
    return ((this.key === ID || this.isInternalField()) && !this.isAdded()) || !this.isRemovable();
  }

  /**
   * Determine if the value has been decrypted via CSFLE.
   *
   * Warning: This does *not* apply to the children of decrypted elements!
   * This only returns true for the exact field that was decrypted.
   *
   * a: Object
   *  \-- b: Object <- decrypted
   *      \-- c: number
   *
   * a.isValueDecrypted() === false
   * a.get('b').isValueDecrypted() === true
   * a.get('b').get('c').isValueDecrypted() === true
   *
   * @returns {Boolean} If the value was encrypted on the server and is now decrypted.
   */
  isValueDecrypted(): boolean {
    return this.decrypted;
  }

  /**
   * Detemine if this value or any of its children were marked
   * as having been decrypted with CSFLE.
   *
   * Warning: This does *not* apply to the children of decrypted elements!
   * This only returns true for the exact field that was decrypted
   * and its parents.
   *
   * a: Object
   *  \-- b: Object <- decrypted
   *      \-- c: number
   *
   * a.containsDecryptedChildren() === true
   * a.get('b').containsDecryptedChildren() === true
   * a.get('b').get('c').containsDecryptedChildren() === false
   *
   * @returns {Boolean} If any child of this element has been decrypted directly.
   */
  containsDecryptedChildren(): boolean {
    if (this.isValueDecrypted()) {
      return true;
    }
    for (const element of this.elements || []) {
      if (element.containsDecryptedChildren()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determine if the value is editable.
   *
   * @returns {Boolean} If the value is editable.
   */
  isValueEditable(): boolean {
    return (
      this._isKeyLegallyEditable() &&
      !UNEDITABLE_TYPES.includes(this.currentType)
    );
  }

  /**
   * Determine if the key of the parent element is editable.
   *
   * @returns {Boolean} If the parent's key is editable.
   */
  isParentEditable(): boolean {
    if (this.parent && !this.parent.isRoot()) {
      return this.parent._isKeyLegallyEditable();
    }
    return true;
  }

  _isKeyLegallyEditable(): boolean {
    return (
      this.isParentEditable() && (this.isAdded() || (this.currentKey !== ID && !this.isInternalField()))
    );
  }

  /**
   * Determine if the key is editable.
   *
   * @returns {Boolean} If the key is editable.
   */
  isKeyEditable(): boolean {
    return this._isKeyLegallyEditable() && !this.containsDecryptedChildren();
  }

  /**
   * Is this a field that is used internally by the MongoDB driver or server
   * and not for user consumption?
   *
   * @returns {Boolean}
   */
  isInternalField(): boolean {
    if (this.parent && !this.parent.isRoot() && this.parent.isInternalField()) {
      return true;
    }
    return this.currentKey === SAFE_CONTENT_FIELD;
  }

  /**
   * Determine if the element is modified at all.
   *
   * @returns {Boolean} If the element is modified.
   */
  isModified(): boolean {
    if (this.elements) {
      for (const element of this.elements) {
        if (element.isModified()) {
          return true;
        }
      }
    }
    return this.isAdded() || this.isEdited() || this.isRemoved();
  }

  /**
   * Is the element flagged for removal?
   *
   * @returns {Boolean} If the element is flagged for removal.
   */
  isRemoved(): boolean {
    return this.removed;
  }

  /**
   * Elements themselves are not the root.
   *
   * @returns {false} Always false.
   */
  isRoot(): false {
    return false;
  }

  /**
   * Flag the element for removal.
   */
  remove(): void {
    this.revert();
    this.removed = true;
    if (this.parent) {
      this._bubbleUp(Events.Removed, this, this.parent);
    }
  }

  /**
   * Revert the changes to the element.
   */
  revert(): void {
    if (this.isAdded()) {
      if (this.parent?.currentType === 'Array') {
        this.parent.elements!.updateKeys(this, -1);
      }
      this.parent!.elements!.remove(this);
      this._bubbleUp(Events.Removed, this, this.parent);
      this.parent = null;
    } else {
      if (this.originalExpandableValue) {
        this.elements = this._generateElements(this.originalExpandableValue);
        this.currentValue = undefined;
      } else {
        if (this.currentValue === null && this.value !== null) {
          this.elements = null;
        } else {
          this._removeAddedElements();
        }
        this.currentValue = this.value;
      }
      this.currentKey = this.key;
      this.currentType = this.type;
      this.removed = false;
    }
    this.setValid();
    this._bubbleUp(Events.Reverted, this);
  }

  /**
   * Fire and bubble up the event.
   *
   * @param {Event} evt - The event.
   * @param {*} data - Optional.
   */
  _bubbleUp(evt: typeof Events[keyof typeof Events], ...data: BSONArray): void {
    this.emit(evt, ...data);
    const element = this.parent;
    if (element) {
      if (element.isRoot()) {
        element.emit(evt, ...data);
      } else {
        element._bubbleUp(evt, ...data);
      }
    }
  }

  /**
   * Convert this element to an empty object.
   */
  _convertToEmptyObject(): void {
    this.edit({});
    this.insertPlaceholder();
  }

  /**
   * Convert to an empty array.
   */
  _convertToEmptyArray(): void {
    this.edit([]);
    this.insertPlaceholder();
  }

  /**
   * Is the element empty?
   *
   * @param {Element} element - The element to check.
   *
   * @returns {Boolean} If the element is empty.
   */
  _isElementEmpty(this: unknown, element: Element | undefined | null): boolean {
    return !!element && element.isAdded() && element.isBlank();
  }

  /**
   * Check if the value is expandable.
   *
   * @param {Object} value - The value to check.
   *
   * @returns {Boolean} If the value is expandable.
   */
  _isExpandable(
    this: unknown,
    value: BSONValue
  ): value is BSONObject | BSONArray {
    return isObject(value) || isArray(value);
  }

  /**
   * Generates a sequence of child elements.
   *
   * @param {Object} object - The object to generate from.
   *
   * @returns {Array} The elements.
   */
  _generateElements(object: BSONObject | BSONArray): LinkedList {
    return new LinkedList(this, object); // eslint-disable-line no-use-before-define
  }

  /**
   * Get the key for the element.
   *
   * @param {String} key
   * @param {Number} index
   *
   * @returns {String|Number} The index if the type is an array, or the key.
   */
  _key(key: string, index: number): string | number {
    return this.currentType === 'Array' ? index : key;
  }

  /**
   * Add a new element to the parent.
   */
  _next(): void {
    if (
      !this._isElementEmpty(this.nextElement) &&
      !this._isElementEmpty(this)
    ) {
      this.parent!.insertAfter(this, '', '');
    }
  }

  /**
   * Removes the added elements from the element.
   */
  _removeAddedElements(): void {
    if (this.elements) {
      for (const element of this.elements) {
        if (element.isAdded()) {
          this.elements.remove(element);
        }
      }
    }
  }

  /**
   * @deprecated Use ElementEvents import instead
   */
  static get Events(): typeof ElementEvents {
    return ElementEvents;
  }
}

/**
 * Represents a doubly linked list.
 */
export class LinkedList {
  firstElement: Element | null;
  lastElement: Element | null;
  doc: Element | Document;
  originalDoc: BSONObject | BSONArray;
  keys: string[] | number[];
  size: number;
  loaded: number;
  _map: Record<string, Element>;

  /**
   * Get the element at the provided index.
   *
   * @param {Integer} index - The index.
   *
   * @returns {Element} The matching element.
   */
  at(index: number): Element | undefined {
    this.flush();
    if (!Number.isInteger(index)) {
      return undefined;
    }

    let element = this.firstElement;
    for (let i = 0; i < index; i++) {
      if (!element) {
        return undefined;
      }
      element = element.nextElement;
    }
    return element === null ? undefined : element;
  }

  get(key: string | number): Element | undefined {
    this.flush();
    return this._map[key];
  }

  // Instantiate the new doubly linked list.
  constructor(doc: Document | Element, originalDoc: BSONObject | BSONArray) {
    this.firstElement = null;
    this.lastElement = null;
    this.doc = doc;
    this.originalDoc = originalDoc;
    this.keys = keys(this.originalDoc);
    if (this.doc.currentType === 'Array') {
      this.keys = this.keys.map((k) => parseInt(k, 10));
    }
    this.size = this.keys.length;
    this.loaded = 0;
    this._map = {};
  }

  /**
   * Insert data after the provided element.
   *
   * @param {Element} element - The element to insert after.
   * @param {String} key - The element key.
   * @param {Object} value - The element value.
   * @param {Boolean} added - If the element is new.
   * @param {Object} parent - The parent.
   *
   * @returns {Element} The inserted element.
   */
  insertAfter(
    element: Element,
    key: string | number,
    value: BSONValue,
    added: boolean,
    parent: Element | Document
  ): Element {
    this.flush();
    return this._insertAfter(element, key, value, added, parent);
  }

  /**
   * Update the currentKey of each element if array elements.
   *
   * @param {Element} element - The element to insert after.
   * @param {Number} add - 1 if adding a new element, -1 if removing.
   */
  updateKeys(element: Element, add: number): void {
    this.flush();
    while (element.nextElement) {
      (element.nextElement as any).currentKey += add;
      element = element.nextElement;
    }
  }

  /**
   * If an element is added after a placeholder, convert that placeholder
   * into an empty element with the correct key.
   *
   * @param {Element} element - The placeholder element.
   */
  handleEmptyKeys(element: Element): void {
    if (element.currentKey === '') {
      let e = element;
      while (e.currentKey === '') {
        if (!e.previousElement) {
          e.currentKey = 0;
          break;
        } else {
          e = e.previousElement;
        }
      }
      while (e.nextElement) {
        e.nextElement.currentKey = (e.currentKey as number) + 1;
        e = e.nextElement;
      }
    }
  }

  /**
   * Insert data before the provided element.
   *
   * @param {Element} element - The element to insert before.
   * @param {String} key - The element key.
   * @param {Object} value - The element value.
   * @param {Boolean} added - If the element is new.
   * @param {Object} parent - The parent.
   *
   * @returns {Element} The inserted element.
   */
  insertBefore(
    element: Element,
    key: string | number,
    value: BSONValue,
    added: boolean,
    parent: Document | Element
  ): Element {
    this.flush();
    return this._insertBefore(element, key, value, added, parent);
  }

  /**
   * Insert data at the beginning of the list.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The element value.
   * @param {Boolean} added - If the element is new.
   * @param {Object} parent - The parent.
   *
   * @returns {Element} The data element.
   */
  insertBeginning(
    key: string | number,
    value: BSONValue,
    added: boolean,
    parent: Document | Element
  ): Element {
    this.flush();
    return this._insertBeginning(key, value, added, parent);
  }

  /**
   * Insert data at the end of the list.
   *
   * @param {String} key - The element key.
   * @param {Object} value - The element value.
   * @param {Boolean} added - If the element is new.
   * @param {Object} parent - The parent.
   *
   * @returns {Element} The data element.
   */
  insertEnd(
    key: string | number,
    value: BSONValue,
    added: boolean,
    parent: Document | Element
  ): Element {
    this.flush();
    if (!this.lastElement) {
      return this.insertBeginning(key, value, added, parent);
    }
    return this.insertAfter(this.lastElement, key, value, added, parent);
  }

  flush(): void {
    if (this.loaded < this.size) {
      // Only iterate from the loaded index to the size.
      for (const element of this) {
        element?.elements?.flush();
      }
    }
  }

  /**
   * Get an iterator for the list.
   *
   * @returns {Iterator} The iterator.
   */
  *[Symbol.iterator](): Iterator<Element> {
    let currentElement: Element | undefined | null;
    let index = 0;
    while (true) {
      if (this._needsLazyLoad(index)) {
        const key = this.keys[index];
        index += 1;
        currentElement = this._lazyInsertEnd(key);
        yield currentElement;
      } else if (this._needsStandardIteration(index)) {
        if (currentElement) {
          currentElement = currentElement.nextElement;
        } else {
          currentElement = this.firstElement;
        }
        if (currentElement) {
          index += 1;
          yield currentElement;
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  _needsLazyLoad(index: number): boolean {
    return (
      (index === 0 && this.loaded === 0 && this.size > 0) ||
      (this.loaded <= index && index < this.size)
    );
  }

  _needsStandardIteration(index: number): boolean {
    return this.loaded > 0 && index < this.loaded && index < this.size;
  }

  /**
   * Insert on the end of the list lazily.
   *
   * @param {String} key - The key.
   *
   * @returns {Element} The inserted element.
   */
  _lazyInsertEnd(key: string | number): Element {
    this.size -= 1;
    return this._insertEnd(
      key,
      (this.originalDoc as any)[key],
      (this.doc as Document).cloned,
      this.doc
    );
  }

  _insertEnd(
    key: string | number,
    value: BSONValue,
    added: boolean,
    parent: Document | Element
  ): Element {
    if (!this.lastElement) {
      return this._insertBeginning(key, value, added, parent);
    }
    return this._insertAfter(this.lastElement, key, value, added, parent);
  }

  _insertBefore(
    element: Element,
    key: string | number,
    value: BSONValue,
    added: boolean,
    parent: Document | Element
  ): Element {
    const newElement = new Element(
      key,
      value,
      added,
      parent,
      element.previousElement,
      element
    );
    if (element.previousElement) {
      element.previousElement.nextElement = newElement;
    } else {
      this.firstElement = newElement;
    }
    element.previousElement = newElement;
    this._map[newElement.key] = newElement;
    this.size += 1;
    this.loaded += 1;
    return newElement;
  }

  _insertBeginning(
    key: string | number,
    value: BSONValue,
    added: boolean,
    parent: Document | Element
  ): Element {
    if (!this.firstElement) {
      const element = new Element(key, value, added, parent, null, null);
      this.firstElement = this.lastElement = element;
      this.size += 1;
      this.loaded += 1;
      this._map[element.key] = element;
      return element;
    }
    const newElement = this.insertBefore(
      this.firstElement,
      key,
      value,
      added,
      parent
    );
    this._map[newElement.key] = newElement;
    return newElement;
  }

  _insertAfter(
    element: Element,
    key: string | number,
    value: BSONValue,
    added: boolean,
    parent: Document | Element
  ): Element {
    const newElement = new Element(
      key,
      value,
      added,
      parent,
      element,
      element.nextElement
    );
    if (element.nextElement) {
      element.nextElement.previousElement = newElement;
    } else {
      this.lastElement = newElement;
    }
    element.nextElement = newElement;
    this._map[newElement.key] = newElement;
    this.size += 1;
    this.loaded += 1;
    return newElement;
  }

  /**
   * Remove the element from the list.
   *
   * @param {Element} element - The element to remove.
   *
   * @returns {DoublyLinkedList} The list with the element removed.
   */
  remove(element: Element): this {
    this.flush();
    if (element.previousElement) {
      element.previousElement.nextElement = element.nextElement;
    } else {
      this.firstElement = element.nextElement;
    }
    if (element.nextElement) {
      element.nextElement.previousElement = element.previousElement;
    } else {
      this.lastElement = element.previousElement;
    }
    element.nextElement = element.previousElement = null;
    delete this._map[element.currentKey];
    this.size -= 1;
    this.loaded -= 1;
    return this;
  }

  findIndex(el: Element): number {
    let idx = 0;
    for (const item of this) {
      if (item === el) {
        return idx;
      }
      idx++;
    }
    return -1;
  }
}

export default Element;
