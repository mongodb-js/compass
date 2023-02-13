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
        ignoreEmptyStrings: true,
      });

      const resultPath = filepath.replace(/\.csv$/, '.analyzed.json');
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
      expect(
        result,
        basename.replace(/\.csv$/, '.analyzed.json')
      ).to.deep.equal(expectedResult);
      expect(progressCallback.callCount).to.equal(result.totalRows);
    });
  }

  for (const [type, filepath] of Object.entries(fixtures.csvByType)) {
    // array and object relates to the structure, not the CSVfield types
    if (['array', 'object'].includes(type)) {
      continue;
    }

    // not all types are bi-directional (yet)
    if (
      [
        'binData',
        'decimal',
        'javascript',
        'javascriptWithScope',
        'maxKey',
        'minKey',
        'objectId',
        'regex',
        'timestamp',
      ].includes(type)
    ) {
      continue;
    }

    const basename = path.basename(filepath);

    let expectedTypes = [type];
    let expectedDetected = type;

    if (type === 'null') {
      // the null test file contains an example of what mongoexport does which
      // is to turn null into a blank string, but to us that means either
      // undefined or blank string depending on the value of ignoreEmptyStrings
      expectedTypes = ['null', 'undefined'];
      expectedDetected = 'null';
    }

    if (type === 'date') {
      // the date test file contains an example of a date as an iso string and
      // an example of a date as an int64 value. Obviously with no other context
      // the number is detected as a long, so in that case it will be up to the
      // user to explicitly select Date as the column's type when importing.
      expectedTypes = ['date', 'long'];
      expectedDetected = 'mixed';
    }

    if (type === 'number') {
      expectedTypes = ['int', 'double', 'long'];
      expectedDetected = 'mixed';
    }

    if (type === 'mixed') {
      expectedTypes = ['int', 'double', 'string', 'date', 'long'];
      expectedDetected = 'mixed';
    }

    it(`detects ${expectedDetected} for ${basename} with ignoreEmptyStrings=true`, async function () {
      const abortController = new AbortController();
      const progressCallback = sinon.spy();
      const result = await analyzeCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: ',',
        abortSignal: abortController.signal,
        progressCallback,
        ignoreEmptyStrings: true,
      });

      for (const [fieldName, field] of Object.entries(result.fields)) {
        // ignore note / padding fields
        if (['something', 'something_else', 'notes'].includes(fieldName)) {
          continue;
        }

        expect(Object.keys(field.types), `${fieldName} types`).to.deep.equal(
          expectedTypes
        );
        expect(field.detected, `${fieldName} detected`).to.equal(
          expectedDetected
        );
      }

      expect(progressCallback.callCount).to.equal(result.totalRows);
    });
  }

  it(`detects mixed for null.csv with ignoreEmptyStrings=false`, async function () {
    const abortController = new AbortController();
    const progressCallback = sinon.spy();
    const result = await analyzeCSVFields({
      input: fs.createReadStream(fixtures.csvByType.null),
      delimiter: ',',
      abortSignal: abortController.signal,
      progressCallback,
      ignoreEmptyStrings: false,
    });

    for (const [fieldName, field] of Object.entries(result.fields)) {
      // ignore note / padding fields
      if (['something', 'something_else', 'notes'].includes(fieldName)) {
        continue;
      }

      expect(Object.keys(field.types), `${fieldName} types`).to.deep.equal([
        'null',
        'string',
      ]);
      expect(field.detected, `${fieldName} detected`).to.equal('mixed');
    }

    expect(progressCallback.callCount).to.equal(result.totalRows);
  });

  it('responds to abortSignal.aborted', async function () {
    const abortController = new AbortController();
    const progressCallback = sinon.spy();

    abortController.abort();

    const result = await analyzeCSVFields({
      input: fs.createReadStream(fixtures.csv.complex),
      delimiter: ',',
      abortSignal: abortController.signal,
      progressCallback,
      ignoreEmptyStrings: true,
    });

    // only looked at the first row because we aborted before even starting
    expect(result.totalRows).to.equal(1);

    // signals that it was aborted and the results are therefore incomplete
    expect(result.aborted).to.equal(true);
  });
});
