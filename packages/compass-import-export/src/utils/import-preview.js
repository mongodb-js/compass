import { Writable } from 'stream';
import peek from 'peek-stream';
import createParser from './import-parser';
import { detectType, valueToString } from './bson-csv';
import dotnotation from './dotnotation';
import assert from 'assert';
import FILE_TYPES from '../constants/file-types';
import { createDebug } from './logger';

const debug = createDebug('import-preview');

/**
 * Peek the first 20k of a file and parse it.
 *
 * @param {String} fileType csv|json
 * @param {String} delimiter
 * @param {Boolean} fileIsMultilineJSON
 * @returns {stream.Transform}
 */
export const createPeekStream = function (
  fileType,
  delimiter,
  fileIsMultilineJSON
) {
  return peek({ maxBuffer: 20 * 1024 }, function (data, swap) {
    return swap(
      null,
      createParser({
        fileType: fileType,
        delimiter: delimiter,
        fileIsMultilineJSON: fileIsMultilineJSON,
      })
    );
  });
};

/**
 * Collects 10 parsed documents from createPeekStream().
 *
 * @option {Number} MAX_SIZE The number of documents/rows we want to preview [Default `10`]
 * @returns {stream.Writable}
 */
export default function ({
  MAX_SIZE = 10,
  fileType,
  // delimiter
  // fileIsMultilineJSON
} = {}) {
  return new Writable({
    objectMode: true,
    write: function (doc, encoding, next) {
      if (!this.docs) {
        this.docs = [];
        this.fields = [];
        this.values = [];
      }

      if (this.docs.length >= MAX_SIZE) {
        debug('noop');
        return next();
      }

      this.docs.push(doc);

      const docAsDotnotation = dotnotation.serialize(doc);

      if (this.fields.length === 0) {
        // eslint-disable-next-line prefer-const
        for (let [key, value] of Object.entries(docAsDotnotation)) {
          if (typeof key === 'symbol') {
            key = key.description;
          }

          assert.equal(
            typeof key,
            'string',
            `import-preview: expected key to be a String not ${typeof key}`
          );

          const isCSV = fileType === FILE_TYPES.CSV;
          const item = { path: key, checked: true };

          if (isCSV) {
            item.type = detectType(value);
          }

          this.fields.push(item);
        }

        debug('set fields', this.fields, { from: doc });
      }

      const keys = Object.keys(docAsDotnotation);

      if (keys.length !== this.fields.length) {
        debug('invariant detected!', {
          expected: this.fields.map((f) => f.path),
          got: keys,
        });
      }

      const values = Object.values(docAsDotnotation).map((value) =>
        valueToString(value)
      );

      debug('set values', values);

      this.values.push(values);

      return next(null);
    },
  });
}
