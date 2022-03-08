import { Transform } from 'stream';
import { parse as JSONParser } from 'JSONStream';
import { EJSON } from 'bson';
import csv from 'csv-parser';
import { createDebug } from './logger';
import parseJSON from 'parse-json';
import throttle from 'lodash.throttle';
import progressStream from 'progress-stream';

const debug = createDebug('import-parser');

/**
 * A transform stream that turns file contents in objects
 * quickly and smartly.
 *
 * @returns {Stream.Transform}
 */
export const createCSVParser = function({ delimiter = ',' } = {}) {
  return csv({
    separator: delimiter
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
  debug('creating json parser with selector', { selector, fileName });
  // return new JSONParser(selector);
  let lastChunk = '';
  const parser = new JSONParser(selector);
  const stream = new Transform({
    writableObjectMode: false,
    readableObjectMode: true,
    transform: function(chunk, enc, cb) {
      lastChunk = chunk;
      debug('parser write', chunk.toString('utf-8'));
      parser.write(chunk);
      cb();
    }
  });

  parser.on('data', (d) => {
    try {
      const doc = EJSON.parse(EJSON.stringify(d, {
        relaxed: false,
        promoteValues: true,
        bsonRegExp: true,
        legacy: false
      }), {
        relaxed: false,
        legacy: false,
        promoteValues: true,
        bsonRegExp: true
      });
      debug('JSON parser on data', {d, doc });
      stream.push(doc);
    } catch (e) {
      debug('error parsing JSON', e);
    }
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

/**
 * How often to update progress via a leading throttle
 */
const PROGRESS_UPDATE_INTERVAL = 250;

/**
 * Since we have no idea what the size of a document
 * will be as part of an import before we've started,
 * just pick a nice number of bytes :)
 *
 * @see utils/import-size-guesstimator
 * will figure out a more realistic number once the documents start
 * flowing through the pipechain.
 */
const NAIVE_AVERAGE_DOCUMENT_SIZE = 800;

/**
 * Creates a transform stream for measuring progress at any point in the pipechain
 * backing an import operation. The `onProgress` callback will be throttled to only update once
 * every `${PROGRESS_UPDATE_INTERVAL}ms`.
 *
 * @param {Number} fileSize The total file size
 * @param {Function} onProgress Your callback for progress updates
 * @returns {stream.Transform}
 */
export const createProgressStream = function(fileSize, onProgress) {
  const progress = progressStream({
    objectMode: true,
    length: fileSize / NAIVE_AVERAGE_DOCUMENT_SIZE,
    time: PROGRESS_UPDATE_INTERVAL // NOTE: ask lucas how time is different from an interval here.
  });

  function updateProgress(info) {
    onProgress(null, info);
  }

  const updateProgressThrottled = throttle(
    updateProgress,
    PROGRESS_UPDATE_INTERVAL,
    { leading: true }
  );

  progress.on('progress', updateProgressThrottled);

  return progress;
};

/**
 * Convenience for creating the right parser transform stream in a single call.
 *
 * @param {String} fileName
 * @param {String} fileType `csv` or `json`
 * @param {String} delimiter See `createCSVParser()`
 * @param {Boolean} fileIsMultilineJSON
 * @returns {stream.Transform}
 */
function createParser({
  fileName = 'myfile',
  fileType = 'json',
  delimiter = ',',
  fileIsMultilineJSON = false
} = {}) {
  if (fileType === 'csv') {
    return createCSVParser({
      delimiter: delimiter
    });
  }
  debug('got kwargs', {
    fileName: fileName,
    fileType: fileType,
    delimiter: delimiter,
    fileIsMultilineJSON: fileIsMultilineJSON,
  });
  return createJSONParser({
    selector: fileIsMultilineJSON ? null : '*',
    fileName: fileName
  });
}

// export const createEJSONDeserializer = function() {
//   return new Transform({
//     objectMode: true,

//   const doc = EJSON.deserialize(d, {
//     promoteValues: true,
//     bsonRegExp: true
//   });
// };

export default createParser;
