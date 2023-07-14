/* eslint-disable no-console */
import fs from 'fs';
import { analyzeCSVFields } from '../src/import/analyze-csv-fields';

function run() {
  console.log(process.argv);
  const input = fs.createReadStream(process.argv[2]);
  const delimiter = ' ';
  const newline = '\n';
  let numRows = 0;
  let start = Date.now();
  const progressCallback = () => {
    numRows++;
    if (numRows % 100000 === 0) {
      console.log(Date.now() - start); // ms per 100k
      start = Date.now();
    }
  };
  return analyzeCSVFields({ input, delimiter, newline, progressCallback });
}

run()
  .then((result) => {
    console.dir(result, { depth: Infinity });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
