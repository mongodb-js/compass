import assert from 'assert';
import path from 'path';
import { expect } from 'chai';
import fs from 'fs';
import { guessFileType } from './guess-filetype';
import { listCSVFields } from './list-csv-fields';
import { fixtures } from '../../test/fixtures';

const expectedFieldsByFile = {
  'bad.csv': {},
  'good-commas.csv': {},
  'good-tabs.csv': {},
  'number-transform.csv': {},
  'sparse.csv': {},
  'semicolons.csv': {},
  'spaces.csv': {},
  'array.csv': {},
  'object.csv': {},
  'complex.csv': {},
} as const;

describe('listCSVFields', function () {
  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);
    it(`detects correct fields for ${basename}`, async function () {
      const typeResult = await guessFileType({
        input: fs.createReadStream(filepath),
      });
      assert(typeResult.type === 'csv');
      const csvDelimiter = typeResult.csvDelimiter;
      const result = await listCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: csvDelimiter,
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
      expect(result, basename.replace(/.csv$/, '.preview.json')).to.deep.equal(
        expectedResult
      );
    });
  }
});
