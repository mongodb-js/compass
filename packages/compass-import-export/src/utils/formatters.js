/* eslint-disable no-var */
/* eslint-disable callback-return */
/* eslint-disable complexity */

/**
 * TODO: lucas: rename `export-formatters`
 */

import csv from 'fast-csv';
import { EJSON } from 'bson';
import { serialize as flatten } from './bson-csv';
import { Transform } from 'stream';

/**
 * @returns {Stream.Transform}
 */
export const createJSONFormatter = function({ brackets = true } = {}) {
  return new Transform({
    readableObjectMode: false,
    writableObjectMode: true,
    transform: function(doc, encoding, callback) {
      const s = EJSON.stringify(doc);
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
export const createCSVFormatter = function() {
  return csv.format({
    headers: true,
    transform: row => flatten(row)
  });
};
