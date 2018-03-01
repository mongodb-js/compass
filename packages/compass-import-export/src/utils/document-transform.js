import { Transform } from 'stream';
import EJSON from 'mongodb-extjson';
import FILE_TYPES from 'constants/file-types';

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
    const data = this.toCSV(chunk, this.isFirstRecord);
    this.isFirstRecord = false;
    return callback(null, `${data}\n`);
  }

  toCSV(obj, withHeader) {
    let csv = withHeader ? Object.keys(obj).join(',') + '\n' : '';
    csv = csv.concat(
      Object.values(obj).map(v => typeof v === 'object' ? EJSON.stringify(v) : v.toString()).join(',')
    );
    return csv;
  }
}

export default DocumentTransform;
