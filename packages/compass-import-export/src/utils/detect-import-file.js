import fs from 'fs';
import peek from 'peek-stream';
import stream from 'stream';

import { createDebug } from './logger';
import { mark, stop } from 'marky';

const debug = createDebug('detect-import-file');

const DEFAULT_FILE_TYPE = 'json';

// const importOptions = {
//   fileIsMultilineJSON: false,
//   fileType: DEFAULT_FILE_TYPE
// };

/**
 * Guess the `importOptions` to use for parsing the contents of
 * `fileName` without looking at the entire file.
 *
 * @param {String} fileName
 * @param {Function} done (err, importOptions)
 *
 * TODO: lucas: Include more heuristics. Ideally the user just picks the file
 * and we auto-detect the various formats/options.
 **/
function detectImportFile(fileName, done) {
  debug('peeking at', fileName);

  let fileType;
  let fileIsMultilineJSON = false;

  const source = fs.createReadStream(fileName, 'utf-8');
  const peeker = peek({ maxBuffer: 1024 }, function(data, swap) {
    const contents = data.toString('utf-8');
    debug('peek is', contents);
    if (contents[0] === '[' || contents[0] === '{') {
      fileType = 'json';
      if (contents[contents.length - 1] === '}') {
        fileIsMultilineJSON = true;
      }
    } else if (/\.(csv)$/.test(fileName)) {
      fileType = 'csv';
    } else {
      fileType = DEFAULT_FILE_TYPE;
    }

    /**
     * TODO: lucas: guess delimiter like papaparse in the future.
     * https://github.com/mholt/PapaParse/blob/49170b76b382317356c2f707e2e4191430b8d495/docs/resources/js/papaparse.js#L1264
     */
    debug('swapping');
    swap('done');
  });

  mark('detect-import-file');
  stream.pipeline(source, peeker, function(err) {
    stop('detect-import-file');
    if (err && err !== 'done') {
      debug('pipeline error', err);
      return done(err);
    }
    const result = {
      fileName: fileName,
      fileIsMultilineJSON: fileIsMultilineJSON,
      fileType: fileType
    };

    debug('detected', result);
    return done(null, result);
  });
}
export default detectImportFile;
