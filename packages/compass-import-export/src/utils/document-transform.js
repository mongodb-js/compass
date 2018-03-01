/* eslint no-extend-native: 0 */
import { Transform } from 'stream';
import EJSON from 'mongodb-extjson';
import FILE_TYPES from 'constants/file-types';
import bson from 'bson';

/**
 * An empty string.
 */
const EMPTY = '';

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.ObjectId.prototype.toCSVString = function() {
  return `ObjectId("${this.toHexString()}")`;
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.Binary.prototype.toCSVString = function() {
  return `Binary("${this.toString()}",${this.sub_type})`;
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.Code.prototype.toCSVString = function() {
  return `Code("${this.code}",${JSON.stringify(this.scope)})`;
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.Decimal128.prototype.toCSVString = function() {
  return this.toString();
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.Double.prototype.toCSVString = function() {
  return this.value;
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.Int32.prototype.toCSVString = function() {
  return this.value;
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.MaxKey.prototype.toCSVString = function() {
  return 'MaxKey()';
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.MinKey.prototype.toCSVString = function() {
  return 'MinKey()';
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.Long.prototype.toCSVString = function() {
  return this.toString();
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
bson.BSONRegExp.prototype.toCSVString = function() {
  return `${this.pattern}${this.options}`;
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
String.prototype.toCSVString = function() {
  return this;
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
Boolean.prototype.toCSVString = function() {
  return this;
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
Date.prototype.toCSVString = function() {
  return this.toISOString();
};

/**
 * Adding CSV functionality.
 *
 * @returns {String} The CSV string.
 */
Object.prototype.toCSVString = function() {
  return `"${JSON.stringify(this)}"`;
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
    this.isFirstRecord = true;
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
    this.isFirstRecord = false;
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
    const csv = this.isFirstRecord ? Object.keys(obj).join(',') + '\n' : EMPTY;
    return `${csv}${Object.values(obj).map((v) => this.toCSVString(v)).join(',')}`;
  }

  /**
   * Get the CSV string for the value.
   *
   * @param {Object} value - The value.
   *
   * @returns {String} The CSV String.
   */
  toCSVString(value) {
    return (value === null || value === undefined) ? EMPTY : value.toCSVString();
  }
}

export default DocumentTransform;
