import { Transform } from 'stream';
import { parse as JSONParser } from 'JSONStream';
import { EJSON } from 'bson';
import csv from 'csv-parser';
import { createLogger } from './logger';
import parseJSON from 'parse-json';

const debug = createLogger('parsers');

/**
 * TODO: lucas: Add papaparse `dynamicTyping` of values
 * https://github.com/mholt/PapaParse/blob/5219809f1d83ffa611ebe7ed13e8224bcbcf3bd7/papaparse.js#L1216
 */

/**
 * TODO: lucas: mapHeaders option to support existing `.<bson_type>()` caster
 * like `mongoimport` does today.
 */

/**
 * A transform stream that turns file contents in objects
 * quickly and smartly.
 *
 * @returns {Stream.Transform}
 */
export const createCSVParser = function() {
  return csv({
    strict: true
  });
};

/**
 * A transform stream that parses JSON strings and deserializes
 * any extended JSON objects into BSON.
 *
 * @param {String} [selector] `null` for ndjson or `'*'` for JSON array. [default '*']
 * @param {String} [fileName] [default 'import.json']
 * @returns {Stream.Transform}
 */
export const createJSONParser = function({
  selector = '*',
  fileName = 'import.json'
} = {}) {
  debug('creating json parser with selector', selector);
  let lastChunk = '';
  const parser = new JSONParser(selector);
  const stream = new Transform({
    writableObjectMode: false,
    readableObjectMode: true,
    transform: function(chunk, enc, cb) {
      lastChunk = chunk;
      parser.write(chunk);
      cb();
    }
  });

  parser.on('data', d => {
    const doc = EJSON.deserialize(d);
    stream.push(doc);
  });

  parser.on('error', function(err) {
    try {
      parseJSON(lastChunk.toString('utf-8'), EJSON.deserialize, fileName);
      // TODO: lucas: yeah having 2 json parses is weird
      // and could be an edge case here, but deal with it later.
    } catch (e) {
      debug('error parsing JSON', e);
      debug('original JSONStream error', err);
      stream.emit('error', e);
    } finally {
      lastChunk = '';
    }
  });

  parser.on('end', stream.emit.bind(stream, 'end'));

  return stream;
};
