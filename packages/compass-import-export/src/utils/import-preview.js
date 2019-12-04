import { Writable } from 'stream';
import peek from 'peek-stream';
import createParser from './import-parser';
import dotnotation from './dotnotation';

import { detectType } from './bson-csv';
import { createLogger } from './logger';
const debug = createLogger('import-preview');

/**
 * Peek the first 20k of a file and parse it.
 *
 * @param {String} fileType csv|json
 * @param {String} delimiter
 * @param {Boolean} fileIsMultilineJSON
 * @returns {stream.Transform}
 */
export const createPeekStream = function(
  fileType,
  delimiter,
  fileIsMultilineJSON
) {
  return peek({ maxBuffer: 20 * 1024 }, function(data, swap) {
    return swap(
      null,
      createParser({
        fileType: fileType,
        delimiter: delimiter,
        fileIsMultilineJSON: fileIsMultilineJSON
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
export default function({ MAX_SIZE = 10 } = {}) {
  return new Writable({
    objectMode: true,
    write: function(doc, encoding, next) {
      if (!this.docs) {
        this.docs = [];
        this.fields = [];
        this.values = [];
      }

      if (this.docs.length >= MAX_SIZE) {
        return next();
      }
      this.docs.push(doc);

      const docAsDotnotation = dotnotation.serialize(doc);

      if (this.fields.length === 0) {
        // eslint-disable-next-line prefer-const
        for (let [key, value] of Object.entries(docAsDotnotation)) {
          // TODO: lucas: Document this weird bug I found with my apple health data.
          // eslint-disable-next-line no-control-regex
          key = key.replace(/[^\x00-\x7F]/g, '');
          this.fields.push({
            path: key,
            checked: true,
            type: detectType(value)
          });
        }
        debug('set fields', this.fields, { from: doc });
      }

      const keys = Object.keys(docAsDotnotation);
      if (keys.length !== this.fields.length) {
        debug('invariant detected!', {
          expected: this.fields.map((f) => f.path),
          got: keys
        });
      }
      this.values.push(Object.values(docAsDotnotation));

      return next(null);
    }
  });
}
