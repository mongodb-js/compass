/* eslint-disable no-console */
import { Transform } from 'stream';

const sizeof = require('object-sizeof');

export default function createImportSizeGuesstimator(
  source,
  fileTotalSize,
  onGuesstimate
) {
  // TODO: lucas: this kinda works now :) could be way better
  // BUT good enough for now.
  return new Transform({
    objectMode: true,
    transform: function (chunk, encoding, cb) {
      if (!this.sizes) {
        this.sizes = [];
        this._done = false;
        this.lastBytesRead = 0;
      }

      if (this._done === true) {
        return cb(null, chunk);
      }

      this.sizes.push(sizeof(chunk));

      /**
       * fs reads files in 64 kb blocks (default highwatermark for createReadStream()
       * So the first time our stream gets data on or after 64 kb,
       * we can say the number of docs our stream has seen so far
       * might be pretty close to the number of docs in the file.
       */
      if (
        source.bytesRead >= 65536 &&
        !this._done &&
        this.sizes.length === 1000
      ) {
        this._done = true;

        const bytesPerDoc = source.bytesRead / this.sizes.length;
        const estimatedTotalDocs = fileTotalSize / bytesPerDoc;

        onGuesstimate(null, estimatedTotalDocs);

        console.group('Object Size estimator');
        console.log('source.bytesRead', source.bytesRead);
        console.log('bytesPerDoc', bytesPerDoc);
        console.log('docs seen', this.sizes.length);
        console.log('est docs', estimatedTotalDocs);
        console.log('js object sizes for docs seen', this.sizes);
        console.groupEnd();
      }

      return cb(null, chunk);
    },
  });
}
