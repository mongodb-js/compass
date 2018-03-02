/* eslint no-extend-native: 0 */
import { Transform } from 'stream';
import EJSON from 'mongodb-extjson';
import FILE_TYPES from 'constants/file-types';

/**
 * An empty string.
 */
const EMPTY = '';

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const objectIdToCSVString = (value) => {
  return `ObjectId("${value.toHexString()}")`;
};

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const binaryToCSVString = (value) => {
  return `Binary("${value.toString()}",${value.sub_type})`;
};

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const codeToCSVString = (value) => {
  return `Code("${value.code}",${JSON.stringify(value.scope)})`;
};

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const stringifyableToCSVString = (value) => {
  return value.toString();
};

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const valueToCSVString = (value) => {
  return value.value;
};

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const maxKeyToCSVString = () => {
  return 'MaxKey()';
};

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const minKeyToCSVString = () => {
  return 'MinKey()';
};

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const regexpToCSVString = (value) => {
  return `${value.pattern}${value.options}`;
};

/**
 * Adding CSV functionality.
 *
 * @param {Object} value - The value.
 *
 * @returns {String} The CSV string.
 */
const dbRefToCSVString = value => {
  return `"${JSON.stringify(value)}"`;
};

/**
 * Mappings of bson types to CSV string generators.
 */
const CSV_MAPPINGS = {
  'Binary': binaryToCSVString,
  'Code': codeToCSVString,
  'DBRef': dbRefToCSVString,
  'Decimal128': stringifyableToCSVString,
  'Double': valueToCSVString,
  'Int32': valueToCSVString,
  'Long': stringifyableToCSVString,
  'MaxKey': maxKeyToCSVString,
  'MinKey': minKeyToCSVString,
  'ObjectID': objectIdToCSVString,
  'BSONRegExp': regexpToCSVString,
  'Timestamp': stringifyableToCSVString
};

/**
 * Transforms documents into lines in an export file.
 */
class DocumentTransform extends Transform {

  /**
   * Create the new transform with a transform output type.
   *
   * @param {String} type - The type.
   */
  constructor(type) {
    super({ writableObjectMode: true, encoding: 'utf8' });
    this.type = type;
    this.header = null;
  }

  /**
   * Transform the chunk.
   *
   * @param {Object} chunk - The document chunk.
   * @param {String} encoding - The encoding.
   * @param {Function} callback - The callback.
   *
   * @returns {Object} The result of the callback.
   */
  _transform(chunk, encoding, callback) {
    if (this.type === FILE_TYPES.JSON) {
      const data = EJSON.stringify(chunk);
      return callback(null, `${data}\n`);
    }
    const data = this.toCSV(chunk);
    return callback(null, `${data}\n`);
  }

  /**
   * Convert the object chunk to CSV format.
   *
   * @param {Object} obj - The object.
   *
   * @returns {String} The CSV String.
   */
  toCSV(obj) {
    let output = EMPTY;
    if (this.header === null) {
      this.header = Object.keys(obj);
      output = `${this.header.join(',')}\n`;
    }
    return `${output}${this.header.map((v) => this.toCSVString(obj[v])).join(',')}`;
  }

  /**
   * Get the CSV string for the value.
   *
   * @param {Object} value - The value.
   *
   * @returns {String} The CSV String.
   */
  toCSVString(value) {
    if (value === null || value === undefined) {
      return EMPTY;
    }
    if (value.hasOwnProperty('_bsontype')) {
      return CSV_MAPPINGS[value._bsontype](value);
    }
    if (typeof value === 'object') {
      return `"${JSON.stringify(value)}"`;
    }
    return value;
  }
}

export default DocumentTransform;
