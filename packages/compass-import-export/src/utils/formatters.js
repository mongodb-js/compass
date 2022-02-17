/* eslint-disable no-var */
/* eslint-disable callback-return */
/* eslint-disable complexity */

import * as csv from 'fast-csv';
import { EJSON } from 'bson';
import { serialize as flatten } from './bson-csv';
import { Transform } from 'stream';
import { EOL } from 'os';
import pick from 'lodash.pick';
/**
 * @returns {Stream.Transform}
 */
export const createJSONFormatter = function({ brackets = true, columns = [] } = {}) {
  return new Transform({
    readableObjectMode: false,
    writableObjectMode: true,
    transform: function(doc, encoding, callback) {
      const docToBeSerialized = columns.length > 0 ? pick(doc, columns) : doc;
      if (this._counter >= 1) {
        if (brackets) {
          this.push(',');
        } else {
          this.push(EOL);
        }
      }
      const s = EJSON.stringify(docToBeSerialized, null, brackets ? 2 : null);
      if (this._counter === undefined) {
        this._counter = 0;
        if (brackets) {
          this.push('[');
        }
      }
      callback(null, s);
      this._counter++;
    },
    final: function(done) {
      if (brackets) {
        this.push(']');
      }
      done();
    }
  });
};

/**
 * @returns {Stream.Transform}
 */
export const createCSVFormatter = function({ columns }) {
  return csv.format({
    headers: columns,
    alwaysWriteHeaders: true,
    transform: row => {
      return flatten(row);
    }
  });
};
