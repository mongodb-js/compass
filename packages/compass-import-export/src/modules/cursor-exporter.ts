import type { AbstractCursor } from 'mongodb';
import { EventEmitter } from 'events';
import * as stream from 'stream';
import { promisify } from 'util';
import { createCSVFormatter, createJSONFormatter } from '../utils/formatters';
const pipeline = promisify(stream.pipeline).bind(stream);

export interface CursorExporterOpts {
  cursor: AbstractCursor;
  type: 'csv' | 'json';
  columns: Array<string> | boolean;
  output: stream.Writable;
  totalNumberOfDocuments?: number | null;
}
export class CursorExporter extends EventEmitter {
  private _cursor: AbstractCursor;
  private _output: stream.Writable;
  private _formatter;
  private _columns: Array<string> | boolean;
  private _totalNumberOfDocuments: number;
  private _exportedDocuments = 0;
  private _cursorStream: stream.Readable;
  constructor(opts: CursorExporterOpts) {
    super();
    this._cursor = opts.cursor;
    this._cursorStream = opts.cursor.stream();
    this._formatter =
      opts.type === 'csv' ? createCSVFormatter : createJSONFormatter;
    this._output = opts.output;
    this._columns = opts.columns ? opts.columns : true;
    this._totalNumberOfDocuments = opts.totalNumberOfDocuments || 0;
  }

  async start(): Promise<void> {
    const p = pipeline(
      this._cursorStream,
      this.getProgressTransformStream(),
      this.getFormatter(),
      this._output
    );
    return p;
  }
  cancel(): boolean {
    this._cursorStream.unpipe();
    this._cursorStream.emit('end');
    return true;
  }

  private getFormatter() {
    return this._formatter({ columns: this._columns });
  }

  private getProgressTransformStream() {
    const emit = this.emit.bind(this);
    return new stream.Transform({
      readableObjectMode: true,
      writableObjectMode: true,
      transform: (doc, encoding, callback) => {
        try {
          this._exportedDocuments++;
          emit('progress', this._exportedDocuments);
        } catch (err) {
          // do nothing
        } finally {
          callback(null, doc);
        }
      },
    });
  }
}
