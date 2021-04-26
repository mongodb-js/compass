import { ShellApiClass, shellApiClassDefault } from './decorators';
import { shellApiType, asPrintable } from './enums';
import { Document, ObjectIdType } from '@mongosh/service-provider-core';

@shellApiClassDefault
export class CommandResult extends ShellApiClass {
  value: unknown;
  type: string;
  constructor(type: string, value: unknown) {
    super();
    this.type = type;
    this.value = value;
    this[shellApiType] = type;
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): unknown {
    return this.value;
  }
}

@shellApiClassDefault
export class BulkWriteResult extends ShellApiClass {
  acknowledged: boolean;
  insertedCount: number;
  insertedIds: {[index: number]: ObjectIdType};
  matchedCount: number;
  modifiedCount: number;
  deletedCount: number;
  upsertedCount: number;
  upsertedIds: {[index: number]: ObjectIdType};
  constructor(
    acknowledged: boolean,
    insertedCount: number,
    insertedIds: {[index: number]: ObjectIdType},
    matchedCount: number,
    modifiedCount: number,
    deletedCount: number,
    upsertedCount: number,
    upsertedIds: {[index: number]: ObjectIdType}) {
    super();
    this.acknowledged = acknowledged;
    this.insertedCount = insertedCount;
    this.insertedIds = insertedIds;
    this.matchedCount = matchedCount;
    this.modifiedCount = modifiedCount;
    this.deletedCount = deletedCount;
    this.upsertedCount = upsertedCount;
    this.upsertedIds = upsertedIds;
  }
}

@shellApiClassDefault
export class InsertManyResult extends ShellApiClass {
  acknowledged: boolean;
  insertedIds: { [key: number]: ObjectIdType };
  constructor(acknowledged: boolean, insertedIds: { [key: number]: ObjectIdType }) {
    super();
    this.acknowledged = acknowledged;
    this.insertedIds = insertedIds;
  }
}

@shellApiClassDefault
export class InsertOneResult extends ShellApiClass {
  acknowledged: boolean;
  insertedId: ObjectIdType | undefined;
  constructor(acknowledged: boolean, insertedId?: ObjectIdType) {
    super();
    this.acknowledged = acknowledged;
    this.insertedId = insertedId;
  }
}

@shellApiClassDefault
export class UpdateResult extends ShellApiClass {
  acknowledged: boolean;
  insertedId: ObjectIdType;
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  constructor(
    acknowledged: boolean,
    matchedCount: number,
    modifiedCount: number,
    upsertedCount: number,
    insertedId: ObjectIdType) {
    super();
    this.acknowledged = acknowledged;
    this.insertedId = insertedId;
    this.matchedCount = matchedCount;
    this.modifiedCount = modifiedCount;
    this.upsertedCount = upsertedCount;
  }
}

@shellApiClassDefault
export class DeleteResult extends ShellApiClass {
  acknowledged: boolean;
  deletedCount: number | undefined;
  constructor(acknowledged: boolean, deletedCount: number | undefined) {
    super();
    this.acknowledged = acknowledged;
    this.deletedCount = deletedCount;
  }
}

@shellApiClassDefault
export class CursorIterationResult extends ShellApiClass {
  cursorHasMore: boolean;
  documents: Document[];

  constructor() {
    super();
    this.cursorHasMore = true; // filled by iterate() in helpers.ts or the _it() methods
    this.documents = [];
  }
}
