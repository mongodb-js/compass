/* eslint-disable no-var */
/* eslint-disable callback-return */
/* eslint-disable complexity */

import csv from 'fast-csv';
import { EJSON } from 'bson';
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

// HT https://github.com/hughsk/flat/blob/master/index.js
const formatTabularRow = function(doc, opts = { delimiter: '.' }) {
  var delimiter = opts.delimiter || '.';
  var maxDepth = opts.maxDepth;
  var output = {};

  function step(object, prev, currentDepth = 1) {
    Object.keys(object).forEach(function(key) {
      var value = object[key];
      var isarray = opts.safe && Array.isArray(value);
      var type = Object.prototype.toString.call(value);
      var isobject = type === '[object Object]' || type === '[object Array]';
      var isbson = isobject && value._bsontype;

      var newKey = prev ? prev + delimiter + key : key;

      if (
        !isarray &&
        !isbson &&
        isobject &&
        Object.keys(value).length &&
        (!opts.maxDepth || currentDepth < maxDepth)
      ) {
        return step(value, newKey, currentDepth + 1);
      }
      if (isbson) {
        value = value.toString('hex');
      }
      output[newKey] = value;
    });
  }
  step(doc);
  return output;
};

/**
 * @returns {Stream.Transform}
 */
export const createCSVFormatter = function() {
  return csv.format({
    headers: true,
    transform: row => formatTabularRow(row)
  });
};
