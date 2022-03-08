/* eslint-disable no-var */
/* eslint-disable callback-return */
/* eslint-disable complexity */

import * as csv from 'fast-csv';
import { EJSON } from 'bson';
import { serialize as flatten } from './bson-csv';
import { Transform } from 'stream';
import { EOL } from 'os';
import type { CsvFormatterStream } from 'fast-csv/build/src/formatter';
/**
 * @returns {Stream.Transform}
 */
interface FormatterOptions {
  brackets?: boolean;
  columns?: string[] | undefined;
}
class JSONFormatterStream extends Transform {
  private _counter = 0;
  private _brackets: boolean | undefined;
  constructor(opts: FormatterOptions) {
    super({
      readableObjectMode: false,
      writableObjectMode: true,
    });
    this._brackets = opts.brackets;
  }
  _final(callback: (error?: Error | null) => void): void {
    if (this._brackets) {
      this.push(']');
    }
    callback(null);
  }
  _transform(
    doc: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null, data?: any) => void
  ): void {
    if (this._counter >= 1) {
      if (this._brackets) {
        this.push(',');
      } else {
        this.push(EOL);
      }
    }
    const s = EJSON.stringify(doc, [], this._brackets ? 2 : null);
    if (this._counter === undefined) {
      this._counter = 0;
      if (this._brackets) {
        this.push('[');
      }
    }
    callback(null, s);
    this._counter++;
  }
}
export const createJSONFormatter = function ({
  brackets = true,
} = {}): Transform {
  return new JSONFormatterStream({ brackets });
};

/**
 * @returns {Stream.Transform}
 */
export const createCSVFormatter = function (
  opts: FormatterOptions
): CsvFormatterStream {
  return csv.format({
    headers: true,
    columns: opts.columns,
    alwaysWriteHeaders: true,
    transform: (row) => {
      return flatten(row);
    },
  });
};
