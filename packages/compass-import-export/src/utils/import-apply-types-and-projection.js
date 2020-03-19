import { Transform, PassThrough } from 'stream';
import bsonCSV, { getTypeDescriptorForValue } from './bson-csv';
import _ from 'lodash';

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
    debug('data is an array');
    return data.map(transformProjectedTypes.bind(null, spec));
  } else if (data === null || data === undefined) {
    debug('data is null or undefined');
    return data;
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    debug('empty doc');
    return data;
  }
  const result = data;

  _.forEach(
    spec.exclude,
    function(d) {
      if (spec.exclude.indexOf(d) > -1) {
        _.unset(result, [d]);
        debug('dropped', d);
        return false;
      }
      return true;
    },
    {}
  );

  const lookup = _.fromPairs(spec.transform);
  const lookupKeys = _.keys(lookup);
  lookupKeys.forEach(function(keyPath) {
    const targetType = _.get(lookup, keyPath);
    const typeDescriptor = getTypeDescriptorForValue(_.get(data, keyPath));
    const sourceType = typeDescriptor.t;
    const isBSON = typeDescriptor.isBSON;

    const casted = bsonCSV[targetType].fromString(_.get(data, keyPath));
    _.set(result, keyPath, casted);

    debug(`${keyPath} casted`, {
      result: casted,
      to: targetType,
      from: sourceType,
      isBSON,
      lookupKeys
    });
  });

  debug('result', result);
  return result;
}

export default transformProjectedTypes;

/**
 * Use `transformProjectedTypes` in a stream.
 *
 * @param {spec} spec
 * @returns {TransformStream}
 */
export function transformProjectedTypesStream(spec) {
  if (!Array.isArray(spec.transform)) {
    throw new TypeError('spec.transform must be an array');
  }
  if (!Array.isArray(spec.exclude)) {
    throw new TypeError('spec.exclude must be an array');
  }
  if (spec.transform.length === 0 && spec.exclude.length === 0) {
    debug('spec is a noop. passthrough stream');
    return new PassThrough({ objectMode: true });
  }

  debug('creating transform stream for spec', spec);
  return new Transform({
    objectMode: true,
    transform: function(doc, encoding, cb) {
      const result = transformProjectedTypes(spec, doc);
      cb(null, result);
    }
  });
}
