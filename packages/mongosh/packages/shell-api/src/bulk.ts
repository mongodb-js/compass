import { hasAsyncChild, returnsPromise, ShellApiClass, shellApiClassDefault, returnType } from './decorators';
import Mongo from './mongo';
import { CommonErrors, MongoshInvalidInputError, MongoshUnimplementedError } from '@mongosh/errors';
import {
  Batch,
  Document,
  WriteConcern,
  OrderedBulkOperation,
  UnorderedBulkOperation,
  FindOperators,
  CollationOptions
} from '@mongosh/service-provider-core';
import { asPrintable } from './enums';
import { blockedByDriverMetadata } from './error-codes';
import { assertArgsDefinedType } from './helpers';
import { BulkWriteResult } from './result';
import type Collection from './collection';

@shellApiClassDefault
export class BulkFindOp extends ShellApiClass {
  _serviceProviderBulkFindOp: FindOperators;
  _parentBulk: Bulk;
  _hint: Document | undefined;
  _arrayFilters: Document[] | undefined;
  constructor(innerFind: FindOperators, parentBulk: Bulk) {
    super();
    this._serviceProviderBulkFindOp = innerFind;
    this._parentBulk = parentBulk;
  }

  [asPrintable](): string {
    return 'BulkFindOp';
  }

  @returnType('BulkFindOp')
  collation(spec: CollationOptions): BulkFindOp {
    this._serviceProviderBulkFindOp.collation(spec);
    return this;
  }

  // Blocked by NODE-2751, bulk arrayFilters
  arrayFilters(): BulkFindOp {
    throw new MongoshUnimplementedError(
      'arrayFilters method on fluent Bulk API is not currently supported.',
      CommonErrors.NotImplemented,
      blockedByDriverMetadata('BulkFindOp.arrayFilters')
    );
  }

  @returnType('BulkFindOp')
  hint(hintDoc: Document): BulkFindOp {
    assertArgsDefinedType([hintDoc], [true], 'BulkFindOp.hint');
    this._hint = hintDoc;
    return this;
  }

  @returnType('Bulk')
  remove(): Bulk {
    this._parentBulk._batchCounts.nRemoveOps++;
    this._serviceProviderBulkFindOp.remove();
    return this._parentBulk;
  }

  @returnType('Bulk')
  removeOne(): Bulk {
    this._parentBulk._batchCounts.nRemoveOps++;
    this._serviceProviderBulkFindOp.removeOne();
    return this._parentBulk;
  }

  @returnType('Bulk')
  replaceOne(replacement: Document): Bulk {
    this._parentBulk._batchCounts.nUpdateOps++;
    assertArgsDefinedType([replacement], [true], 'BulkFindOp.replacement');
    const op = { ...replacement };
    if (this._hint) {
      op.hint = this._hint;
    }
    this._serviceProviderBulkFindOp.replaceOne(op);
    return this._parentBulk;
  }

  @returnType('Bulk')
  updateOne(update: Document): Bulk {
    this._parentBulk._batchCounts.nUpdateOps++;
    assertArgsDefinedType([update], [true], 'BulkFindOp.update');
    const op = { ...update };
    if (this._hint) {
      op.hint = this._hint;
    }
    if (this._arrayFilters) {
      op.arrayFilters = this._arrayFilters;
    }
    this._serviceProviderBulkFindOp.updateOne(op);
    return this._parentBulk;
  }

  @returnType('Bulk')
  update(update: Document): Bulk {
    this._parentBulk._batchCounts.nUpdateOps++;
    assertArgsDefinedType([update], [true], 'BulkFindOp.update');
    const op = { ...update };
    if (this._hint) {
      op.hint = this._hint;
    }
    if (this._arrayFilters) {
      op.arrayFilters = this._arrayFilters;
    }
    this._serviceProviderBulkFindOp.update(op);
    return this._parentBulk;
  }

  @returnType('Bulk')
  upsert(): BulkFindOp {
    this._serviceProviderBulkFindOp.upsert();
    return this;
  }
}


@shellApiClassDefault
@hasAsyncChild
export default class Bulk extends ShellApiClass {
  _mongo: Mongo;
  _collection: Collection;
  _batchCounts: any;
  _executed: boolean;
  _serviceProviderBulkOp: OrderedBulkOperation | UnorderedBulkOperation;
  _ordered: boolean;

  constructor(collection: any, innerBulk: OrderedBulkOperation | UnorderedBulkOperation, ordered = false) {
    super();
    this._collection = collection;
    this._mongo = collection._mongo;
    this._serviceProviderBulkOp = innerBulk;
    this._batchCounts = {
      nInsertOps: 0,
      nUpdateOps: 0,
      nRemoveOps: 0
    };
    this._executed = false;
    this._ordered = ordered;
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): any {
    return this.tojson();
  }

  /**
   * Internal helper for emitting collection API call events.
   *
   * @param methodName
   * @param methodArguments
   * @private
   */
  private _emitBulkApiCall(methodName: string, methodArguments: Document = {}): void {
    this._mongo._internalState.emitApiCall({
      method: methodName,
      class: 'Bulk',
      db: this._collection._database._name,
      coll: this._collection._name,
      arguments: methodArguments
    });
  }

  @returnsPromise
  async execute(writeConcern?: WriteConcern): Promise<BulkWriteResult> {
    const { result } = await this._serviceProviderBulkOp.execute() as any;
    this._executed = true;
    this._emitBulkApiCall('execute', { writeConcern: writeConcern });
    return new BulkWriteResult(
      !!result.ok, // acknowledged
      result.nInserted,
      result.insertedIds,
      result.nMatched,
      result.nModified,
      result.nRemoved,
      result.nUpserted,
      result.upserted
    );
  }

  @returnType('BulkFindOp')
  find(query: Document): BulkFindOp {
    assertArgsDefinedType([query], [true], 'Bulk.find');
    return new BulkFindOp(this._serviceProviderBulkOp.find(query), this);
  }

  @returnType('Bulk')
  insert(document: Document): Bulk {
    this._batchCounts.nInsertOps++;
    assertArgsDefinedType([document], [true], 'Bulk.insert');
    this._serviceProviderBulkOp.insert(document);
    return this;
  }

  tojson(): Record<'nInsertOps' | 'nUpdateOps' | 'nRemoveOps' | 'nBatches', number> {
    const batches = this._serviceProviderBulkOp.batches.length;

    return {
      ...this._batchCounts,
      nBatches: batches
    };
  }

  toString(): string {
    return JSON.stringify(this.tojson());
  }

  getOperations(): Pick<Batch, 'originalZeroIndex' | 'batchType' | 'operations'>[] {
    if (!this._executed) {
      throw new MongoshInvalidInputError(
        'Cannot call getOperations on an unexecuted Bulk operation',
        CommonErrors.InvalidOperation
      );
    }
    return this._serviceProviderBulkOp.batches.map((b) => ({
      originalZeroIndex: b.originalZeroIndex,
      batchType: b.batchType,
      operations: b.operations
    }));
  }
}

