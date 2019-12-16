import { Transform, PassThrough } from 'stream';

import bsonCSV from './bson-csv';
import isPlainObject from 'lodash.isplainobject';
import isObjectLike from 'lodash.isobjectlike';

import { createLogger } from './logger';

const debug = createLogger('apply-import-type-and-projection');

/**
 * @typedef spec
 * @property {Array} exclude - Array of dotnotation keys to remove from source document.
 * @property {Object} transform - `{dotnotationpath: targetTypeName}`
 */

/**
 * Transforms objects based on what user selected in preview table.
 *
 * @param {spec} spec
 * @param {any} data
 * @param {String} [keyPrefix] Used internally when recursing into nested objects.
 * @returns {Object}
 */
function transformProjectedTypes(spec, data, keyPrefix = '') {
  if (Array.isArray(data)) {
    return data.map(transformProjectedTypes.bind(null, spec));
  } else if (!isPlainObject(data) || data === null || data === undefined) {
    return data;
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    return data;
  }
  return keys.reduce(function(doc, key) {
    const fullKey = `${keyPrefix}${key}`;

    /**
     * TODO: lucas: Relocate removeEmptyStrings() here?
     * Avoid yet another recursive traversal of every document.
     */
    if (spec.exclude.includes(fullKey)) {
      // Drop the key if unchecked
      return doc;
    }

    const toBSON = bsonCSV[spec.transform[fullKey]];

    if (toBSON && !isObjectLike(data[key])) {
      doc[key] = toBSON.fromString(data[key]);
    } else {
      doc[key] = transformProjectedTypes(spec, data[key], `${fullKey}.`);
    }
    return doc;
  }, {});
}

export default transformProjectedTypes;

/**
 * Use `transformProjectedTypes` in a stream.
 *
 * @param {spec} spec
 * @returns {TransformStream}
 */
export function transformProjectedTypesStream(spec) {
  if (Object.keys(spec.transform).length === 0 && spec.exclude.length === 0) {
    debug('spec is a noop. passthrough stream');
    return new PassThrough();
  }
  debug('creating transform stream for spec', spec);
  return new Transform({
    objectMode: true,
    transform: function(doc, encoding, cb) {
      cb(null, transformProjectedTypes(spec, doc));
    }
  });
}
