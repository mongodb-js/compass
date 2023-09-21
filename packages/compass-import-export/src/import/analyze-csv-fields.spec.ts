/* eslint-disable no-console */
import assert from 'assert';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs';
import { Readable } from 'stream';
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
      const newline = typeResult.newline;

      const abortController = new AbortController();
      const progressCallback = sinon.spy();
      const result = await analyzeCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: csvDelimiter,
        newline,
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
      try {
        expect(
          result,
          basename.replace(/\.csv$/, '.analyzed.json')
        ).to.deep.equal(expectedResult);
      } catch (err) {
        console.log(resultPath);
        console.log(JSON.stringify(result, null, 2));
        throw err;
      }
      expect(progressCallback.callCount).to.equal(result.totalRows);

      const firstCallArg = Object.assign(
        {},
        progressCallback.firstCall.args[0]
      );
      expect(firstCallArg.bytesProcessed).to.be.gt(0);
      delete firstCallArg.bytesProcessed;

      expect(firstCallArg).to.deep.equal({
        docsProcessed: 1,
      });

      const fileStat = await fs.promises.stat(filepath);

      const lastCallArg = Object.assign({}, progressCallback.lastCall.args[0]);

      expect(lastCallArg).to.deep.equal({
        bytesProcessed: fileStat.size,
        docsProcessed: result.totalRows,
      });
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
        'objectId',
        'timestamp',
        'symbol',
        'md5',
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
      // the date test file contains an example of a date as an iso string, an
      // example of a date as an int64 value and a date-only yyyy-mm-dd strig.
      // Obviously with no other context the number is detected as a long, so in
      // those cases it will be up to the user to explicitly select Date as the
      // column's type when importing.
      expectedTypes = ['date', 'long'];
      expectedDetected = 'mixed';
    }

    if (type === 'number') {
      expectedTypes = ['int', 'double', 'long'];
      expectedDetected = 'number';
    }

    if (type === 'mixed') {
      expectedTypes = ['int', 'double', 'string', 'date', 'long'];
      expectedDetected = 'mixed';
    }

    if (type === 'regex') {
      // we detect regex, but we select string
      expectedDetected = 'string';
    }

    it(`detects ${expectedDetected} for ${basename} with ignoreEmptyStrings=true`, async function () {
      const abortController = new AbortController();
      const progressCallback = sinon.spy();
      const result = await analyzeCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: ',',
        newline: '\n',
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
      newline: '\n',
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
      newline: '\n',
      abortSignal: abortController.signal,
      progressCallback,
      ignoreEmptyStrings: true,
    });

    // only looked at the first row because we aborted before even starting
    expect(result.totalRows).to.equal(0);

    // signals that it was aborted and the results are therefore incomplete
    expect(result.aborted).to.equal(true);
  });

  it('does not mind windows style line breaks', async function () {
    const text = await fs.promises.readFile(fixtures.csv.good_commas, 'utf8');
    const input = Readable.from(text.replace(/\n/g, '\r\n'));

    const result = await analyzeCSVFields({
      input,
      delimiter: ',',
      newline: '\n',
    });
    expect(Object.keys(result.fields)).to.deep.equal(['_id', 'value']);
  });

  it('errors if a file is not valid utf8', async function () {
    const latin1Buffer = Buffer.from('ê,foo\n1,2', 'latin1');
    const input = Readable.from(latin1Buffer);

    await expect(
      analyzeCSVFields({
        input,
        delimiter: ',',
        newline: '\n',
      })
    ).to.be.rejectedWith(
      TypeError,
      'The encoded data was not valid for encoding utf-8'
    );
  });

  it('strips the BOM character', async function () {
    const text = await fs.promises.readFile(fixtures.csv.good_commas, 'utf8');
    const input = Readable.from('\uFEFF' + text);
    const result = await analyzeCSVFields({
      input,
      delimiter: ',',
      newline: '\n',
    });
    expect(Object.keys(result.fields)).to.deep.equal(['_id', 'value']);
  });
});
