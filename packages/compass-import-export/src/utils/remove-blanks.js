import { Transform, PassThrough } from 'stream';
import { createLogger } from './logger';
const debug = createLogger('remove-blanks-preview');

/**
 * Based on mongoimport implementation.
 * https://github.com/mongodb/mongo-tools/blob/b1d68af3de3244484d8a7dddd939782d749b2b5c/mongoimport/common.go#L239
 * @returns {Object}
 * @param {Object} data
 */
function removeBlanks(data) {
  if (Array.isArray(data)) {
    return data.map(removeBlanks);
  } else if (typeof data !== 'object' || data === null || data === undefined) {
    return data;
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    return data;
  }
  return keys.reduce(function(doc, key) {
    if (typeof data[key] === 'string' && data[key] === '') {
      return doc;
    }
    doc[key] = removeBlanks(data[key]);
    return doc;
  }, {});
}

export function removeBlanksStream(ignoreEmptyFields) {
  if (!ignoreEmptyFields) {
    debug('Ignore empty fields is no op');
    return new PassThrough({ objectMode: true });
  }
  return new Transform({
    objectMode: true,
    transform: function(doc, encoding, cb) {
      debug('removing balnks from doc');
      cb(null, removeBlanks(doc));
    }
  });
}

export default removeBlanks;
