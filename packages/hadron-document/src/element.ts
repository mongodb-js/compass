'use strict';

import EventEmitter from 'eventemitter3';
import { isPlainObject, isArray, isEqual, isString } from 'lodash';
import type { ObjectGeneratorOptions } from './object-generator';
import ObjectGenerator from './object-generator';
import TypeChecker from 'hadron-type-checker';
import { UUID } from 'bson';
import DateEditor from './editor/date';
import Events from './element-events';
import type Document from './document';
import type { TypeCastTypes } from 'hadron-type-checker';
import type { ObjectId } from 'bson';
import type { BSONArray, BSONObject, BSONValue } from './utils';
import { getDefaultValueForType } from './utils';
import { ElementEvents } from '.';

export const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';
export { Events };

/**
 * Id field constant.
 */
const ID = '_id';

/**
 * Is this the path to a field that is used internally by the
 * MongoDB driver or server and not for user consumption?
 */
export function isInternalFieldPath(path: string | number): boolean {
  return typeof path === 'string' && /^__safeContent__($|\.)/.test(path);
}

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
  elements?: ElementList;
  originalExpandableValue?: BSONObject | BSONArray;
  parent: Element | Document | null;
  type: TypeCastTypes;
  currentType: TypeCastTypes;
  level: number;
  currentTypeValid?: boolean;
  invalidTypeMessage?: string;
  decrypted: boolean;
  expanded = false;

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
   * @param key - The key.
   * @param value - The value.
   * @param parent - The parent element.
   * @param added - Is the element a new 'addition'?
   */
  constructor(
    key: string | number,
    value: BSONValue | number,
    parent: Element | Document | null = null,
    added = false
  ) {
    super();
    this.uuid = new UUID().toHexString();
    this.key = key;
    this.currentKey = key;
    this.parent = parent;
    this.added = added;
    this.removed = false;
    this.type = TypeChecker.type(value);
    this.currentType = this.type;
    this.level = this._getLevel();
    this.setValid();

    // Make sure that all values that element will hold onto will be explicit
    // bson types: convert JavaScript numbers to either Int32 or Double
    if (typeof value === 'number') {
      value = TypeChecker.cast(value, TypeChecker.type(value));
    }

    if (this._isExpandable(value)) {
      // NB: Important to set `originalExpandableValue` first as element
      // generation will depend on it
      this.originalExpandableValue = value;
      this.elements = this._generateElements(value);
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

  get nextElement(): Element | undefined {
    return this.parent?.elements?.findNext(this);
  }

  get previousElement(): Element | undefined {
    return this.parent?.elements?.findPrevious(this);
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
   * @param value - The new value.
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
      this._convertToEmptyObject();
    } else if (newType === 'Array') {
      this._convertToEmptyArray();
    } else {
      try {
        if (newType === 'Date') {
          const editor = new DateEditor(this);
          editor.edit(this.generateObject());
          editor.complete();
        } else {
          this.edit(TypeChecker.cast(this.generateObject(), newType));
        }
      } catch (e: unknown) {
        this.setInvalid(this.currentValue, newType, (e as Error).message);
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
   * @param key - The key name.
   *
   * @returns The element.
   */
  get(key: string | number): Element | undefined {
    return this.elements?.get(key);
  }

  /**
   * Get an element by its index.
   *
   * @param i - The index.
   *
   * @returns The element.
   */
  at(i: number): Element | undefined {
    return this.elements?.at(i);
  }

  /**
   * Rename the element. Update the parent's mapping if available.
   *
   * @param key - The new key.
   */
  rename(key: string | number): void {
    this.currentKey = key;
    this._bubbleUp(Events.Edited, this);
  }

  /**
   * Generate the javascript object for this element.
   *
   * @returns The javascript object.
   */
  generateObject(options?: ObjectGeneratorOptions): BSONValue {
    if (this.currentType === 'Array') {
      return ObjectGenerator.generateArray(this.elements!, options);
    }
    if (this.currentType === 'Object') {
      return ObjectGenerator.generate(this.elements!, options);
    }
    return this.currentValue;
  }

  /**
   * Generate the javascript object representing the original values
   * for this element (pre-element removal, renaming, editing).
   *
   * @returns The javascript object.
   */
  generateOriginalObject(options?: ObjectGeneratorOptions): BSONValue {
    if (this.type === 'Array') {
      const originalElements = this._generateElements(
        this.originalExpandableValue as BSONArray
      );
      return ObjectGenerator.generateOriginalArray(originalElements, options);
    }
    if (this.type === 'Object') {
      const originalElements = this._generateElements(
        this.originalExpandableValue as BSONObject
      );
      return ObjectGenerator.generateOriginal(originalElements, options);
    }

    return this.value;
  }

  /**
   * Insert an element after the provided element. If this element is an array,
   * then ignore the key specified by the caller and use the correct index.
   * Update the keys of the rest of the elements in the LinkedList.
   *
   * @param element - The element to insert after.
   * @param key - The key.
   * @param value - The value.
   *
   * @returns The new element.
   */
  insertAfter(
    element: Element,
    key: string | number,
    value: BSONValue
  ): Element {
    if (!this.elements) {
      throw new Error('Cannot insert values on non-array/non-object elements');
    }
    const newElement = this.elements.insertAfter(element, key, value);
    newElement!._bubbleUp(Events.Added, newElement, this);
    return newElement!;
  }

  /**
   * Add a new element to this element.
   *
   * @param| Number} key - The element key.
   * @param value - The value.
   *
   * @returns The new element.
   */
  insertEnd(key: string | number, value: BSONValue): Element {
    if (!this.elements) {
      throw new Error('Cannot insert values on non-array/non-object elements');
    }
    const newElement = this.elements.insertEnd(key, value, true);
    this._bubbleUp(Events.Added, newElement);
    return newElement;
  }

  /**
   * Insert a placeholder element at the end of the element.
   *
   * @returns The placeholder element.
   */
  insertPlaceholder(): Element {
    // When adding a placeholder value to an array we default to the type
    // of the last value currently in the array. Otherwise empty string.
    const placeholderValue: BSONValue =
      this.currentType === 'Array' && this.elements?.lastElement
        ? getDefaultValueForType(this.elements?.lastElement.currentType)
        : '';

    return this.insertEnd('', placeholderValue);
  }

  insertSiblingPlaceholder(): Element {
    // When adding a sibling placeholder value to an array we default the
    // new values' type to the preceding element's type to hopefully make
    // it so folks don't have to change the type later. Otherwise empty string.
    const placeholderValue: BSONValue =
      this.parent?.currentType === 'Array'
        ? getDefaultValueForType(this.currentType)
        : '';
    return this.parent!.insertAfter(this, '', placeholderValue)!;
  }

  /**
   * Is the element a newly added element
   *
   * @returns If the element is newly added.
   */
  isAdded(): boolean {
    return this.added || !!this.parent?.isAdded();
  }

  /**
   * Is the element blank?
   *
   * @returns If the element is blank.
   */
  isBlank(): boolean {
    return this.currentKey === '' && this.currentValue === '';
  }

  /**
   * Does the element have a valid value for the current type?
   *
   * @returns If the value is valid.
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
   * @param value - The value.
   * @param newType - The new type.
   * @param message - The error message.
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
   * @param value - The value to check.
   *
   * @returns If the key is a duplicate.
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
   * @returns If the element is edited.
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

   * @returns If the value is equal.
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
   * @returns If the element is last.
   */
  isLast(): boolean {
    return this.parent?.elements?.lastElement === this;
  }

  /**
   * Determine if the element was explicitly renamed by the user.
   *
   * @returns If the element was explicitly renamed by the user.
   */
  isRenamed(): boolean {
    if (
      !this.parent ||
      this.parent.isRoot() ||
      this.parent.currentType === 'Object'
    ) {
      return this.key !== this.currentKey;
    }
    return false;
  }

  /**
   * Determine if the element was renamed, potentially as part
   * of moving array elements.
   *
   * @returns If the element was renamed, explicitly or implicitly.
   */
  hasChangedKey(): boolean {
    return this.key !== this.currentKey;
  }

  /**
   * Can changes to the element be reverted?
   *
   * @returns If the element can be reverted.
   */
  isRevertable(): boolean {
    return this.isEdited() || this.isRemoved();
  }

  /**
   * Can the element be removed?
   *
   * @returns If the element can be removed.
   */
  isRemovable(): boolean {
    return !this.parent!.isRemoved();
  }

  /**
   * Can no action be taken on the element
   *
   * @returns If no action can be taken.
   */
  isNotActionable(): boolean {
    return (
      ((this.key === ID || this.isInternalField()) && !this.isAdded()) ||
      !this.isRemovable()
    );
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
   * a.get('b')?.isValueDecrypted() === true
   * a.get('b')?.get('c')?.isValueDecrypted() === true
   *
   * @returns If the value was encrypted on the server and is now decrypted.
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
   * a.get('b')?.containsDecryptedChildren() === true
   * a.get('b')?.get('c')?.containsDecryptedChildren() === false
   *
   * @returns If any child of this element has been decrypted directly.
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
   * @returns If the value is editable.
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
   * @returns If the parent's key is editable.
   */
  isParentEditable(): boolean {
    if (this.parent && !this.parent.isRoot()) {
      return this.parent._isKeyLegallyEditable();
    }
    return true;
  }

  _isKeyLegallyEditable(): boolean {
    return (
      this.isParentEditable() &&
      (this.isAdded() ||
        ((this.currentKey !== ID || !this.parent?.isRoot()) &&
          !this.isInternalField()))
    );
  }

  /**
   * Determine if the key is editable.
   *
   * @returns If the key is editable.
   */
  isKeyEditable(): boolean {
    return this._isKeyLegallyEditable() && !this.containsDecryptedChildren();
  }

  /**
   * Is this a field that is used internally by the MongoDB driver or server
   * and not for user consumption?
   *
   * @returns
   */
  isInternalField(): boolean {
    if (!this.parent) {
      return false;
    }
    if (!this.parent.isRoot() && this.parent.isInternalField()) {
      return true;
    }
    if (this.parent.isRoot() && isInternalFieldPath(this.currentKey)) {
      return true;
    }
    return false;
  }

  /**
   * Determine if the element is modified at all.
   *
   * @returns If the element is modified.
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
   * @returns If the element is flagged for removal.
   */
  isRemoved(): boolean {
    return this.removed;
  }

  /**
   * Are any immediate children of this element flagged for removal?
   *
   * @returns If any immediate children of this element are flagged for removal.
   */
  hasAnyRemovedChild(): boolean {
    if (this.elements) {
      for (const element of this.elements) {
        if (element.isRemoved()) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Elements themselves are not the root.
   *
   * @returns Always false.
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
      this.parent?.elements?.remove(this);
      this._bubbleUp(Events.Removed, this, this.parent);
      delete (this as any).parent;
    } else {
      if (this.originalExpandableValue) {
        this.elements = this._generateElements(this.originalExpandableValue);
        this.currentValue = undefined;
      } else {
        if (this.currentValue === null && this.value !== null) {
          delete this.elements;
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
   * Expands the target element and optionally its children as well.
   * Document.expand is when we would want to expand the children otherwise we
   * will most expand the element itself.
   */
  expand(expandChildren = false): void {
    if (!this._isExpandable(this.originalExpandableValue)) {
      return;
    }

    this.expanded = true;
    if (expandChildren && this.elements) {
      for (const element of this.elements) {
        element.expand(expandChildren);
      }
    }
    this.emit(ElementEvents.Expanded, this);
  }

  /**
   * Collapses only the target element
   */
  collapse(): void {
    if (!this._isExpandable(this.originalExpandableValue)) {
      return;
    }

    this.expanded = false;
    if (this.elements) {
      for (const element of this.elements) {
        element.collapse();
      }
    }
    this.emit(ElementEvents.Collapsed, this);
  }

  /**
   * Fire and bubble up the event.
   *
   * @param evt - The event.
   * @paramdata - Optional.
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
   * @param element - The element to check.
   *
   * @returns If the element is empty.
   */
  _isElementEmpty(element: Element | undefined | null): boolean {
    return !!element && element.isAdded() && element.isBlank();
  }

  /**
   * Check if the value is expandable.
   *
   * @param value - The value to check.
   *
   * @returns If the value is expandable.
   */
  _isExpandable(value: BSONValue): value is BSONObject | BSONArray {
    return isPlainObject(value) || isArray(value);
  }

  /**
   * Generates a sequence of child elements.
   *
   * @param object - The object to generate from.
   *
   * @returns The elements.
   */
  _generateElements(object: BSONObject | BSONArray): ElementList {
    return new ElementList(this, object);
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
export class ElementList implements Iterable<Element> {
  private elements: Element[];

  constructor(
    private parent: Document | Element,
    originalDoc: BSONObject | BSONArray | null | undefined
  ) {
    this.elements = Object.entries(originalDoc ?? {}).map(([k, v]) => {
      return new Element(
        this.isArray() ? parseInt(k, 10) : k,
        v as BSONValue,
        parent,
        parent.isRoot() ? parent.cloned : false
      );
    });
  }

  private isArray(): boolean {
    return this.parent.currentType === 'Array';
  }

  get size(): number {
    return this.elements.length;
  }

  at(index: number): Element | undefined {
    return this.elements[index];
  }

  get(key: string | number): Element | undefined {
    return this.elements.find((el) => {
      return el.currentKey === key;
    });
  }

  some(
    predicate: (value: Element, index: number, array: Element[]) => unknown
  ): boolean {
    return this.elements.some(predicate);
  }

  every(
    predicate: (value: Element, index: number, array: Element[]) => unknown
  ): boolean {
    return this.elements.every(predicate);
  }

  get firstElement(): Element | undefined {
    return this.elements[0];
  }

  get lastElement(): Element | undefined {
    return this.elements[this.elements.length - 1];
  }

  /**
   * Insert data after the provided element.
   *
   * @param afterElement - The element to insert after.
   * @param key - The element key.
   * @param value - The element value.
   * @param added - If the element is new.
   *
   * @returns The inserted element.
   */
  insertAfter(
    afterElement: Element,
    key: string | number,
    value: BSONValue,
    added = true
  ): Element | undefined {
    let newElement;
    let newElementIdx = -1;
    for (const [idx, el] of this.elements.entries()) {
      if (afterElement === el) {
        newElementIdx = idx + 1;
        newElement = new Element(
          this.isArray() ? newElementIdx : key,
          value,
          this.parent,
          added
        );
        continue;
      }
      if (newElement && this.isArray()) {
        el.currentKey = idx + 1;
      }
    }
    if (newElement) {
      this.elements.splice(newElementIdx, 0, newElement);
    }
    return newElement;
  }

  /**
   * Insert data before the provided element.
   *
   * @param beforeElement - The element to insert before.
   * @param key - The element key.
   * @param value - The element value.
   * @param added - If the element is new.
   *
   * @returns The inserted element.
   */
  insertBefore(
    beforeElement: Element,
    key: string | number,
    value: BSONValue,
    added = true
  ): Element | undefined {
    let newElement;
    let newElementIdx = -1;
    for (const [idx, el] of this.elements.entries()) {
      if (beforeElement === el) {
        newElementIdx = idx;
        newElement = new Element(
          this.isArray() ? newElementIdx : key,
          value,
          this.parent,
          added
        );
      }
      if (newElement && this.isArray()) {
        el.currentKey = idx + 1;
      }
    }
    if (newElement) {
      this.elements.splice(newElementIdx, 0, newElement);
    }
    return newElement;
  }

  /**
   * Insert data at the beginning of the list.
   *
   * @param key - The element key.
   * @param value - The element value.
   * @param added - If the element is new.
   *
   * @returns The data element.
   */
  insertBeginning(
    key: string | number,
    value: BSONValue,
    added = true
  ): Element {
    const newElement = new Element(
      this.isArray() ? 0 : key,
      value,
      this.parent,
      added
    );
    if (this.isArray()) {
      this.elements.forEach((el) => {
        (el.currentKey as number) += 1;
      });
    }
    this.elements.unshift(newElement);
    return newElement;
  }

  /**
   * Insert data at the end of the list.
   *
   * @param key - The element key.
   * @param value - The element value.
   * @param added - If the element is new.
   *
   * @returns The data element.
   */
  insertEnd(key: string | number, value: BSONValue, added = true): Element {
    const newElement = new Element(
      this.isArray() ? this.elements.length : key,
      value,
      this.parent,
      added
    );
    this.elements.push(newElement);
    return newElement;
  }

  /**
   * Remove the element from the list.
   *
   * @param removeElement - The element to remove.
   *
   * @returns The list with the element removed.
   */
  remove(removeElement: Element): this {
    let removeIdx = -1;
    for (const [idx, el] of this.elements.entries()) {
      if (el === removeElement) {
        removeIdx = idx;
        continue;
      }
      if (removeIdx !== -1 && this.isArray()) {
        (el.currentKey as number) -= 1;
      }
    }
    if (removeIdx !== -1) {
      this.elements.splice(removeIdx, 1);
    }
    return this;
  }

  findNext(el: Element): Element | undefined {
    const idx = this.elements.indexOf(el);
    return idx !== -1 ? this.elements[idx + 1] : undefined;
  }

  findPrevious(el: Element): Element | undefined {
    const idx = this.elements.indexOf(el);
    return idx !== -1 ? this.elements[idx - 1] : undefined;
  }

  *[Symbol.iterator](): Iterator<Element> {
    yield* this.elements;
  }
}

export default Element;
