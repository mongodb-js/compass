import { Transform } from 'stream';

import bsonCSV from './bson-csv';
import isPlainObject from 'lodash.isplainobject';
import isObjectLike from 'lodash.isobjectlike';

import { createLogger } from './logger';

const debug = createLogger('apply-import-type-and-projection');

/**
 * TODO: lucas: dot notation. Handle extended JSON case.
 */
function getProjection(fields, key) {
  return fields.filter((f) => {
    return f.path === key;
  })[0];
}

function transformProjectedTypes(fields, data) {
  if (Array.isArray(data)) {
    return data.map(transformProjectedTypes.bind(null, fields));
  } else if (!isPlainObject(data) || data === null || data === undefined) {
    return data;
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    return data;
  }
  return keys.reduce(function(doc, key) {
    const def = getProjection(fields, key);

    /**
     * TODO: lucas: Relocate removeEmptyStrings() here?
     * Avoid yet another recursive traversal of every document.
     */
    if (def && !def.checked) {
      return doc;
    }
    if (def.type && bsonCSV[def.type] && !isObjectLike(data[key])) {
      doc[key] = bsonCSV[def.type].fromString(data[key]);
    } else {
      doc[key] = transformProjectedTypes(fields, data[key]);
    }
    return doc;
  }, {});
}

export default transformProjectedTypes;

/**
 * TODO: lucas: Add detection for nothing unchecked and all fields
 * are default type and return a PassThrough.
 */

export function transformProjectedTypesStream(fields) {
  return new Transform({
    objectMode: true,
    transform: function(doc, encoding, cb) {
      cb(null, transformProjectedTypes(fields, doc));
    }
  });
}
