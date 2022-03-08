import type { AbstractCursor } from 'mongodb';
import { EventEmitter } from 'events';
import * as stream from 'stream';
import { promisify } from 'util';
import { createCSVFormatter, createJSONFormatter } from '../utils/formatters';
const pipeline = promisify(stream.pipeline).bind(stream);

export class CursorExporter extends EventEmitter {
  private _cursor: AbstractCursor;
  private _output: stream.Writable;
  private _formatter;
  constructor(
    cursor: AbstractCursor,
    type: 'csv' | 'json',
    output: stream.Writable
  ) {
    super();
    this._cursor = cursor;
    this._formatter = type === 'csv' ? createCSVFormatter : createJSONFormatter;
    this._output = output;
  }

  async start(): Promise<void> {
    await pipeline(
      this._cursor.stream(),
      this.getProgressTransformStream(),
      this.getFormatter(),
      this._output
    );
  }
  private getFormatter() {
    return this._formatter({});
  }
  private getProgressTransformStream() {
    const emit = this.emit.bind(this);
    return new stream.Transform({
      readableObjectMode: true,
      writableObjectMode: true,
      transform: (doc, encoding, callback) => {
        try {
          emit('progress');
        } catch (err) {
          // do nothing
        } finally {
          callback(null, doc);
        }
      },
    });
  }
}
