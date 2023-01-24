import assert from 'assert';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs';
import sinon from 'sinon';
import { guessFileType } from './guess-filetype';
import { analyzeCSVFields } from './analyze-csv-fields';
import { fixtures } from '../../test/fixtures';

describe('analyzeCSVFields', function () {
  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);

    it(`returns correct result for ${basename}`, async function () {
      const typeResult = await guessFileType({
        input: fs.createReadStream(filepath),
      });
      assert(typeResult.type === 'csv');
      const csvDelimiter = typeResult.csvDelimiter;

      const abortController = new AbortController();
      const progressCallback = sinon.spy();
      const result = await analyzeCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: csvDelimiter,
        abortSignal: abortController.signal,
        progressCallback,
      });

      const resultPath = filepath.replace(/.csv$/, '.analyzed.json');
      let text;
      try {
        text = await fs.promises.readFile(resultPath, 'utf8');
      } catch (err) {
        // This helps to tell you which file is missing and what the expected
        // content is which helps when adding a new .csv fixture
        console.log(resultPath);
        console.log(JSON.stringify(result, null, 2));
        throw err;
      }

      const expectedResult = JSON.parse(text);
      expect(result, basename.replace(/.csv$/, '.analyzed.json')).to.deep.equal(
        expectedResult
      );
      expect(progressCallback.callCount).to.equal(result.totalRows);
    });
  }

  it('responds to abortSignal.aborted', async function () {
    const abortController = new AbortController();
    const progressCallback = sinon.spy();

    abortController.abort();

    const result = await analyzeCSVFields({
      input: fs.createReadStream(fixtures.csv.complex),
      delimiter: ',',
      abortSignal: abortController.signal,
      progressCallback,
    });

    // only looked at the first row because we aborted before even starting
    expect(result.totalRows).to.equal(1);

    // signals that it was aborted and the results are therefore incomplete
    expect(result.aborted).to.equal(true);
  });
});
