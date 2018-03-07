import { Transform } from 'stream';
import EJSON from 'mongodb-extjson';
import FILE_TYPES from 'constants/file-types';

const kSource = global.Symbol('source');

/**
 * Transforms lines of JSON or CSV into documents.
 *
 * @returns {SplitLines} The object.
 */
class SplitLines extends Transform {

  /**
   * Create the new transform.
   *
   * @param {String} type - The file type.
   */
  constructor(type) {
    super({ writableObjectMode: true, readableObjectMode: true });
    this[kSource] = '';
    this.type = type;
    this.keys = [];
    this.isFirstRecord = true;
  }

  /**
   * Transform the chunk into an array of documents.
   *
   * @param {String} chunk - The next chunk.
   * @param {String} encoding - The encoding.
   * @param {Function} callback - The callback.
   *
   * @returns {Object} The result of the callback.
   */
  _transform(chunk, encoding, callback) {
    this[kSource] = this[kSource].concat(chunk);
    if (this.isFirstRecord && this.type === FILE_TYPES.CSV) {
      this.keys = this[kSource].split('\n')[0].split(',');
      this.isFirstRecord = false;
    }
    if (this[kSource].indexOf('\n') > -1) {
      const lines = this[kSource].split('\n').filter(Boolean);

      if (this.isLastLineComplete(lines[lines.length - 1])) {
        this[kSource] = '';
        try {
          const parsedLines = (this.type === FILE_TYPES.JSON)
            ? lines.map(this.parseJsonLine)
            : lines.map(this.toCSV);
          return callback(null, parsedLines);
        } catch (e) {
          return callback(e, []);
        }
      }
      const linesToWrite = lines.splice(0, lines.length - 1);
      this[kSource] = lines[0];
      try {
        const parsedLines = (this.type === FILE_TYPES.JSON)
          ? linesToWrite.map(this.parseJsonLine)
          : linesToWrite.map(this.toCSV);
        return callback(null, parsedLines);
      } catch (e) {
        return callback(e, []);
      }
    }
  }

  isJSON(line) {
    let o;
    try {
      o = this.parseJsonLine(line);
    } catch (e) {
      return false;
    }
    return typeof o === 'object';
  }

  isLastLineComplete(line) {
    if (this.type === FILE_TYPES.JSON) {
      return this.isJSON(line);
    }
    return line.endsWith('\n');
  }

  toCSV = (line) => {
    const values = line.split(',');
    const obj = {};
    this.keys.forEach(
      (key, i) => {
        obj[key] = this.isJSON(values[i]) ? this.parseJsonLine(values[i]) : values[i];
      }
    );
    return obj;
  }

  parseJsonLine(line) {
    return EJSON.parse(line);
  }
}

export default SplitLines;
