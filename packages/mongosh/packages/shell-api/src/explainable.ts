import type Collection from './collection';
import type Mongo from './mongo';
import ExplainableCursor from './explainable-cursor';
import {
  hasAsyncChild,
  returnsPromise,
  returnType,
  ShellApiClass,
  shellApiClassDefault,
  serverVersions
} from './decorators';
import { asPrintable, ServerVersions } from './enums';
import {
  validateExplainableVerbosity,
  processRemoveOptions,
  RemoveShellOptions,
  FindAndModifyShellOptions,
  FindAndModifyMethodShellOptions,
  processMapReduceOptions,
  MapReduceShellOptions,
  markAsExplainOutput
} from './helpers';
import type {
  Document,
  ExplainVerbosityLike,
  CountOptions,
  DistinctOptions,
  UpdateOptions,
  FindAndModifyOptions
} from '@mongosh/service-provider-core';

@shellApiClassDefault
@hasAsyncChild
export default class Explainable extends ShellApiClass {
  _mongo: Mongo;
  _collection: Collection;
  _verbosity: ExplainVerbosityLike;
  constructor(mongo: Mongo, collection: Collection, verbosity: ExplainVerbosityLike) {
    super();
    this._mongo = mongo;
    this._collection = collection;
    this._verbosity = verbosity;
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): string {
    return `Explainable(${this._collection.getFullName()})`;
  }

  /**
   * Internal helper for emitting collection API call events.
   *
   * @param methodName
   * @param methodArguments
   * @private
   */
  private _emitExplainableApiCall(methodName: string, methodArguments: Document = {}): void {
    this._mongo._internalState.emitApiCall({
      method: methodName,
      class: 'Explainable',
      db: this._collection._database._name,
      coll: this._collection._name,
      arguments: methodArguments
    });
  }

  getCollection(): Collection {
    this._emitExplainableApiCall('getCollection');
    return this._collection;
  }

  getVerbosity(): ExplainVerbosityLike {
    this._emitExplainableApiCall('getVerbosity');
    return this._verbosity;
  }

  setVerbosity(verbosity: ExplainVerbosityLike): void {
    verbosity = validateExplainableVerbosity(verbosity);
    this._emitExplainableApiCall('setVerbosity', { verbosity });
    this._verbosity = verbosity;
  }

  @returnType('ExplainableCursor')
  find(query?: Document, projection?: Document): ExplainableCursor {
    this._emitExplainableApiCall('find', { query, projection });

    const cursor = this._collection.find(query, projection);
    return new ExplainableCursor(this._mongo, cursor, this._verbosity);
  }

  @returnsPromise
  async aggregate(pipeline?: Document, options?: Document): Promise<any> {
    this._emitExplainableApiCall('aggregate', { pipeline, options });

    return await this._collection.aggregate(pipeline, {
      ...options,
      explain: this._verbosity
    });
  }

  @returnsPromise
  async count(query = {}, options: CountOptions = {}): Promise<Document> {
    this._emitExplainableApiCall('count', { query, options });
    // This is the only one that currently lacks explicit driver support.
    return markAsExplainOutput(await this._collection._database._runCommand({
      explain: {
        count: `${this._collection._database._name}.${this._collection._name}`,
        query,
        ...options
      },
      verbosity: this._verbosity
    }));
  }

  @returnsPromise
  async distinct(field: string, query: Document, options: DistinctOptions = {}): Promise<Document> {
    this._emitExplainableApiCall('distinct', { field, query, options });
    return this._collection.distinct(field, query, { ...options, explain: this._verbosity });
  }

  @returnsPromise
  async findAndModify(options: FindAndModifyMethodShellOptions): Promise<Document> {
    this._emitExplainableApiCall('findAndModify', { options });
    return this._collection.findAndModify({ ...options, explain: this._verbosity });
  }

  @returnsPromise
  async findOneAndDelete(filter: Document, options: FindAndModifyOptions = {}): Promise<Document> {
    this._emitExplainableApiCall('findOneAndDelete', { filter, options });
    return this._collection.findOneAndDelete(filter, { ...options, explain: this._verbosity });
  }

  @returnsPromise
  async findOneAndReplace(filter: Document, replacement: Document, options: FindAndModifyShellOptions = {}): Promise<Document> {
    this._emitExplainableApiCall('findOneAndReplace', { filter, options });
    return this._collection.findOneAndReplace(filter, replacement, { ...options, explain: this._verbosity });
  }

  @returnsPromise
  async findOneAndUpdate(filter: Document, update: Document, options: FindAndModifyShellOptions = {}): Promise<Document> {
    this._emitExplainableApiCall('findOneAndUpdate', { filter, options });
    return this._collection.findOneAndUpdate(filter, update, { ...options, explain: this._verbosity });
  }

  @returnsPromise
  async remove(query: Document, options: boolean | RemoveShellOptions = {}): Promise<Document> {
    this._emitExplainableApiCall('remove', { query, options });
    options = { ...processRemoveOptions(options), explain: this._verbosity };
    return this._collection.remove(query, options);
  }

  @returnsPromise
  async update(filter: Document, update: Document, options: UpdateOptions = {}): Promise<Document> {
    this._emitExplainableApiCall('update', { filter, update, options });
    return this._collection.update(filter, update, { ...options, explain: this._verbosity });
  }

  @returnsPromise
  @serverVersions(['4.4.0', ServerVersions.latest])
  async mapReduce(
    map: Function | string,
    reduce: Function | string,
    optionsOrOutString: MapReduceShellOptions): Promise<Document> {
    this._emitExplainableApiCall('mapReduce', { map, reduce, optionsOrOutString });
    const options = { ...processMapReduceOptions(optionsOrOutString), explain: this._verbosity };
    return this._collection.mapReduce(map, reduce, options);
  }
}
