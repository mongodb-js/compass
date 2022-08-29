import { Transform, PassThrough } from 'stream';
import bsonCSV, { getTypeDescriptorForValue } from './bson-csv';
import { serialize } from './dotnotation';

import _ from 'lodash';

import { createDebug } from './logger';

const debug = createDebug('apply-import-type-and-projection');

/**
 * Transforms values based on what user selected in preview table.
 *
 * @param {any} data Some data you want to transform.
 * @param {Array} transform `[${dotnotation}, ${targetType}]`.
 * @param {Array} exclude `[${dotnotation}]`
 * @param {Boolean} ignoreBlanks Empty strings removed from document before insertion.
 * @param {String} keyPrefix Used internally when recursing into nested objects.
 * @returns {Object}
 */
function transformProjectedTypes(
  data,
  { transform = [], exclude = [], ignoreBlanks = false, keyPrefix = '' } = {}
) {
  if (Array.isArray(data)) {
    debug('data is an array');
    return data.map(function (doc) {
      return transformProjectedTypes(doc, {
        transform,
        exclude,
        ignoreBlanks,
        keyPrefix,
      });
    });
  } else if (data === null || data === undefined) {
    debug('data is null or undefined');
    return data;
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    debug('empty document');
    return data;
  }

  const dotted = serialize(data, { includeObjects: true });
  const result = {};

  _.forEach(
    exclude,
    function (d) {
      if (exclude.indexOf(d) > -1) {
        _.unset(dotted, [d]);
      }
    },
    {}
  );

  const keyPathToTransform = _.fromPairs(transform);

  const allPaths = _.keys(dotted);
  allPaths.forEach(function (keyPath) {
    const value = _.get(dotted, keyPath);
    if (ignoreBlanks === true && value === '') {
      // debug('dropped blank field', value);
      _.unset(result, [keyPath]);
      return false;
    }
    // debug('targetType', {keyPathToTransform, keyPath});

    const targetType = _.get(keyPathToTransform, keyPath);
    if (!targetType) {
      // debug('no transform required');
      _.set(result, keyPath, value);
      return;
    }

    const sourceType = getTypeDescriptorForValue(value).type;

    let casted = value;
    if (targetType !== sourceType) {
      if (!bsonCSV[targetType]) {
        throw new TypeError('Cant find lookup for ' + targetType);
      }
      casted = bsonCSV[targetType].fromString(value);
      // debug('Target type differs from source type. Casting.', {
      //   targetType,
      //   sourceType,
      //   value,
      //   keyPath,
      //   casted,
      // });
    }

    _.set(result, keyPath, casted);
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
export function transformProjectedTypesStream({
  transform = [],
  exclude = [],
  ignoreBlanks = false,
} = {}) {
  if (!Array.isArray(transform)) {
    throw new TypeError('spec.transform must be an array');
  }

  if (!Array.isArray(exclude)) {
    throw new TypeError('spec.exclude must be an array');
  }

  if (
    transform.length === 0 &&
    exclude.length === 0 &&
    ignoreBlanks === false
  ) {
    debug('spec is a noop. passthrough stream');
    return new PassThrough({ objectMode: true });
  }

  debug('creating transform stream for spec', {
    transform,
    exclude,
    ignoreBlanks,
  });
  return new Transform({
    objectMode: true,
    transform: function (doc, _encoding, cb) {
      try {
        const result = transformProjectedTypes(doc, {
          transform,
          exclude,
          ignoreBlanks,
        });
        return cb(null, result);
      } catch (err) {
        return cb(err);
      }
    },
  });
}
