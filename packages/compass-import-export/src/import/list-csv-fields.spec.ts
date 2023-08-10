/* eslint-disable no-console */
import assert from 'assert';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs';
import { Readable } from 'stream';

import { guessFileType } from './guess-filetype';
import { listCSVFields } from './list-csv-fields';

import { fixtures } from '../../test/fixtures';

describe('listCSVFields', function () {
  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);
    it(`detects correct fields for ${basename}`, async function () {
      const typeResult = await guessFileType({
        input: fs.createReadStream(filepath),
      });
      assert(typeResult.type === 'csv');
      const csvDelimiter = typeResult.csvDelimiter;
      const newline = typeResult.newline;
      const result = await listCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: csvDelimiter,
        newline: newline,
      });

      const resultPath = filepath.replace(/.csv$/, '.preview.json');
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
          basename.replace(/.csv$/, '.preview.json')
        ).to.deep.equal(expectedResult);
      } catch (err) {
        console.log(resultPath);
        console.log(JSON.stringify(result, null, 2));
        throw err;
      }
    });
  }

  it('does not mind windows style line breaks', async function () {
    const text = await fs.promises.readFile(fixtures.csv.good_commas, 'utf8');
    const input = Readable.from(text.replace(/\n/g, '\r\n'));

    const result = await listCSVFields({
      input,
      delimiter: ',',
      newline: '\r\n',
    });
    expect(result.headerFields).to.deep.equal(['_id', 'value']);
  });

  it('errors if a file is not valid utf8', async function () {
    const latin1Buffer = Buffer.from('ê,foo\n1,2', 'latin1');
    const input = Readable.from(latin1Buffer);

    await expect(
      listCSVFields({
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
    const result = await listCSVFields({
      input,
      delimiter: ',',
      newline: '\n',
    });
    expect(result.headerFields).to.deep.equal(['_id', 'value']);
  });
});
