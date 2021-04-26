import {
  shellApiClassDefault,
  returnsPromise,
  returnType,
  hasAsyncChild,
  ShellApiClass,
  deprecated
} from './decorators';
import {
  ChangeStream,
  Document,
  ResumeToken
} from '@mongosh/service-provider-core';
import { CursorIterationResult } from './result';
import { asPrintable } from './enums';
import {
  MongoshInvalidInputError,
  MongoshRuntimeError,
  MongoshUnimplementedError
} from '@mongosh/errors';
import { iterate } from './helpers';
import { printWarning } from './deprecation-warning';
import Mongo from './mongo';

@shellApiClassDefault
@hasAsyncChild
export default class ChangeStreamCursor extends ShellApiClass {
  _mongo: Mongo;
  _cursor: ChangeStream;
  _currentIterationResult: CursorIterationResult | null = null;
  _on: string;
  _batchSize: number | null = null;

  constructor(cursor: ChangeStream, on: string, mongo: Mongo) {
    super();
    this._cursor = cursor;
    this._on = on;
    this._mongo = mongo;
  }

  async _it(): Promise<CursorIterationResult> {
    if (this._cursor.closed) {
      throw new MongoshRuntimeError('ChangeStreamCursor is closed');
    }
    const result = this._currentIterationResult = new CursorIterationResult();
    return iterate(result, this._cursor, this._batchSize ?? await this._mongo._batchSize());
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  async [asPrintable](): Promise<string> {
    return `ChangeStreamCursor on ${this._on}`;
  }

  @returnsPromise
  async close(): Promise<void> {
    await this._cursor.close();
  }

  @returnsPromise
  @deprecated
  async hasNext(): Promise<void> {
    printWarning(
      'If there are no documents in the batch, hasNext will block. Use tryNext if you want to check if there ' +
      'are any documents without waiting.',
      this._mongo._internalState.context.print
    );
    return this._cursor.hasNext();
  }

  @returnsPromise
  async tryNext(): Promise<Document | null> {
    if (this._cursor.closed) {
      throw new MongoshRuntimeError('Cannot call tryNext on closed cursor');
    }
    return this._cursor.tryNext();
  }

  async* [Symbol.asyncIterator]() {
    let doc;
    while ((doc = await this.tryNext()) !== null) {
      yield doc;
    }
  }

  isClosed(): boolean {
    return this._cursor.closed;
  }

  isExhausted(): never {
    throw new MongoshInvalidInputError('isExhausted is not implemented for ChangeStreams because after closing a cursor, the remaining documents in the batch are no longer accessible. If you want to see if the cursor is closed use isClosed. If you want to see if there are documents left in the batch, use tryNext.');
  }

  @returnsPromise
  async itcount(): Promise<number> {
    let count = 0;
    while (await this.tryNext()) {
      count++;
    }
    return count;
  }

  @returnsPromise
  async next(): Promise<void> {
    printWarning(
      'If there are no documents in the batch, next will block. Use tryNext if you want to check if there are ' +
      'any documents without waiting.',
      this._mongo._internalState.context.print
    );
    return this._cursor.next();
  }

  getResumeToken(): ResumeToken {
    return this._cursor.resumeToken;
  }

  map(): ChangeStreamCursor {
    throw new MongoshUnimplementedError('Cannot call map on a change stream cursor');
  }
  forEach(): Promise<void> {
    throw new MongoshUnimplementedError('Cannot call forEach on a change stream cursor');
  }
  toArray(): Promise<Document[]> {
    throw new MongoshUnimplementedError('Cannot call toArray on a change stream cursor');
  }
  objsLeftInBatch(): void {
    throw new MongoshUnimplementedError('Cannot call objsLeftInBatch on a change stream cursor');
  }

  @returnType('ChangeStreamCursor')
  pretty(): ChangeStreamCursor {
    return this;
  }

  @returnType('ChangeStreamCursor')
  batchSize(size: number): ChangeStreamCursor {
    this._batchSize = size;
    return this;
  }
}
