import type { TypeCastTypes, TypeCastMap } from 'hadron-type-checker';

declare class EventEmitter {
  on(name: string, fn: Function): void;
  off(name: string, fn: Function): void;
  emit(name: string, ...args: unknown[]): void;
}

declare class LinkedList<T> {
  size: number;
  at(index: number): T | undefined;
  get(key: string): T | undefined;
  insertAfter(
    el: T,
    key: string,
    value: unknown,
    added?: boolean,
    parent?: T
  ): T;
  updateKeys(el: T, add: 1 | -1): void;
  handleEmptyKeys(el: T): void;
  insertBefore(
    el: T,
    key: string,
    value: unknown,
    added?: boolean,
    parent?: T
  ): T;
  insertBeginning(key: string, value: unknown, added?: boolean, parent?: T): T;
  insertEnd(key: string, value: unknown, added?: boolean, parent?: T): T;
  flush(): void;
  [Symbol.iterator](): IterableIterator<T>;
  remove(el: T): this;
}

declare const HadronElementEvents: {
  Added: 'Element::Added';
  Edited: 'Element::Edited';
  Removed: 'Element::Removed';
  Reverted: 'Element::Reverted';
  Converted: 'Element::Converted';
  Invalid: 'Element::Invalid';
  Valid: 'Element::Valid';
};

declare class HadronElement extends EventEmitter {
  constructor(
    key: string,
    value: unknown,
    added: boolean,
    parent: HadronDocument | HadronElement | null,
    previousElement: HadronElement | null,
    nextElement: HadronElement | null
  );
  uuid: string;
  key: string;
  currentKey: string;
  parent: HadronDocument | HadronElement | null;
  previousElement: HadronElement | null;
  nextElement: HadronElement | null;
  added: boolean;
  removed: boolean;
  type: TypeCastTypes;
  currentType: TypeCastTypes;
  currentTypeValid: boolean;
  invalidTypeMessage?: string;
  elements?: LinkedList<HadronElement>;
  originalExpandableValue?: TypeCastMap[typeof this.type];
  value?: TypeCastMap[typeof this.type];
  currentValue: TypeCastMap[typeof this.type];
  level: number;
  bulkEdit(value: string): void;
  cancel(): void;
  edit(value: unknown): void;
  changeType(newType: TypeCastTypes): void;
  get(key: string): HadronElement | undefined;
  at(i: number): HadronElement | undefined;
  next(): HadronElement;
  rename(key: string): void;
  generateObject(): unknown;
  generateOriginalObject(): unknown;
  insertAfter(element: HadronElement, key: string, value: unknown): HadronElement;
  insertEnd(key: string, value: unknown): HadronElement;
  insertPlaceholder(): HadronElement;
  insertSiblingPlaceholder(): HadronElement;
  isAdded(): boolean;
  isBlank(): boolean;
  isCurrentTypeValid(): boolean;
  setValid(): void;
  setInvalid(value: unknown, newType: string, message: string): void;
  isDuplicateKey(key: string): boolean;
  isEdited(): boolean;
  isLast(): boolean;
  isRenamed(): boolean;
  isRevertable(): boolean;
  isRemovable(): boolean;
  isNotActionable(): boolean;
  isValueEditable(): boolean;
  isParentEditable(): boolean;
  isKeyEditable(): boolean;
  isModified(): boolean;
  isRemoved(): boolean;
  isRoot(): false;
  remove(): void;
  revert(): void;
  static Events: typeof HadronElementEvents;
}

declare const HadronDocumentEvents: {
  Cancel: 'Document::Cancel';
};

declare class HadronDocument extends EventEmitter {
  constructor(doc: unknown, cloned: boolean);
  uuid: string;
  type: 'Document';
  currentType: 'Document';
  elements: LinkedList<HadronElement>;
  cancel(): void;
  apply(doc: unknown): void;
  generateObject(): unknown;
  generateOriginalObject(): unknown;
  generateUpdateUnlessChangedInBackgroundQuery(
    alwaysIncludeKeys: null | unknown
  ): { query: unknown; updateDoc: unknown };
  get(key: string): HadronElement;
  getChild(path: string[]): HadronElement;
  getId(): unknown | null;
  getOriginalKeysAndValuesForFieldsThatWereUpdated(
    alwaysIncludeKeys: null | unknown
  ): unknown;
  getOriginalKeysAndValuesForSpecifiedKeys(keys: unknown): unknown;
  getSetUpdateForDocumentChanges(): unknown;
  getStringId(): string;
  getUnsetUpdateForDocumentChanges(): unknown;
  insertPlaceholder(): HadronElement;
  insertEnd(key: string, value: unknown): HadronElement;
  insertBeginning(key: string, value: unknown): HadronElement;
  insertAfter(
    element: HadronElement,
    key: string,
    value: unknown
  ): HadronElement;
  isAdded(): false;
  isModified(): boolean;
  isRemoved(): false;
  isRoot(): true;
  next(): void;
  static Events: typeof HadronDocumentEvents;
}

export declare class Editor {
  constructor(element: HadronElement);
  element: HadronElement;
  edit(value: unknown): void;
  paste(value: string): void;
  size(): number;
  value(): unknown;
  start(): void;
  complete(): void;
}

declare const ElementEditor: {
  (element: HadronElement): {
    Standard: Editor;
    String: Editor;
    Decimal128: Editor;
    Date: Editor;
    Double: Editor;
    Int32: Editor;
    Int64: Editor;
    Null: Editor;
    Undefined: Editor;
    ObjectId: Editor;
  };
  DateEditor: typeof Editor;
  StandardEditor: typeof Editor;
  StringEditor: typeof Editor;
  Decimal128Editor: typeof Editor;
  DoubleEditor: typeof Editor;
  Int32Editor: typeof Editor;
  Int64Editor: typeof Editor;
  NullEditor: typeof Editor;
  UndefinedEditor: typeof Editor;
  ObjectIdEditor: typeof Editor;
};

export default HadronDocument;
export { HadronDocumentEvents as DocumentEvents };
export { HadronElement as Element };
export { HadronElementEvents as ElementEvents };
export { ElementEditor };
