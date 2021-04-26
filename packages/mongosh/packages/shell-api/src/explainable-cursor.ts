import { shellApiClassDefault, returnType } from './decorators';
import Cursor from './cursor';
import Mongo from './mongo';
import { asPrintable } from './enums';
import type { Document, ExplainVerbosityLike } from '@mongosh/service-provider-core';

@shellApiClassDefault
export default class ExplainableCursor extends Cursor {
  _baseCursor: Cursor;
  _verbosity: ExplainVerbosityLike;
  _explained: any;

  constructor(mongo: Mongo, cursor: Cursor, verbosity: ExplainVerbosityLike) {
    super(mongo, cursor._cursor);
    this._baseCursor = cursor;
    this._verbosity = verbosity;
    this._explained = null;
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  async [asPrintable](): Promise<any> {
    // Cache the result so that we don't explain over and over again for the
    // same object.
    this._explained ??= await this._baseCursor.explain(this._verbosity);
    return this._explained;
  }

  @returnType('ExplainableCursor')
  map(f: (doc: Document) => Document): ExplainableCursor {
    return super.map(f) as ExplainableCursor;
  }
}
