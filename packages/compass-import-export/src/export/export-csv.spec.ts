import _ from 'lodash';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import temp from 'temp';

temp.track();

import type { DataService } from 'mongodb-data-service';
import { connect } from 'mongodb-data-service';

import { fixtures } from '../../test/fixtures';

import { exportCSVFromQuery, exportCSVFromAggregation } from './export-csv';
import { guessFileType } from '../import/guess-filetype';
import { analyzeCSVFields } from '../import/analyze-csv-fields';
import { importCSV } from '../import/import-csv';
import { importJSON } from '../import/import-json';

import allTypesDoc from '../../test/docs/all-bson-types';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('exportCSV', function () {
  let dataService: DataService;
  let dropCollection;
  let createCollection;
  let insertMany;

  beforeEach(async function () {
    dataService = await connect({
      connectionString: 'mongodb://localhost:27018/local',
    });

    dropCollection = promisify(dataService.dropCollection.bind(dataService));

    createCollection = promisify(
      dataService.createCollection.bind(dataService)
    );

    insertMany = promisify(dataService.insertMany.bind(dataService));

    try {
      await dropCollection('db.col');
    } catch (err) {
      // ignore
    }
    await createCollection('db.col', {});
  });

  afterEach(async function () {
    try {
      await dataService.disconnect();
    } catch (err) {
      // ignore
    }
  });

  it.only('exports all bson types', async function () {
    await insertMany('db.col', allTypesDoc, {});

    const output = temp.createWriteStream();
    const result = await exportCSVFromQuery({
      ns: 'db.col',
      dataService,
      output,
    });
    const text = fs.readFileSync(output.path, 'utf8');
    console.log(text);
    expect(result).to.deep.equal({
      docsWritten: 1,
      aborted: false,
    });
  });

  for (const jsonVariant of ['json', 'jsonl'] as const) {
    for (const filepath of Object.values(
      fixtures[jsonVariant] as Record<string, string>
    )) {
      const basename = path.basename(filepath);
      it(`exports ${basename}`, async function () {
        const { docsWritten } = await importJSON({
          dataService,
          ns: 'db.col',
          input: fs.createReadStream(filepath),
          jsonVariant,
        });

        const output = temp.createWriteStream();
        const result = await exportCSVFromQuery({
          ns: 'db.col',
          dataService,
          output,
        });
        const text = fs.readFileSync(output.path, 'utf8');
        console.log(text);
        expect(result).to.deep.equal({
          docsWritten,
          aborted: false,
        });
      });
    }
  }

  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);

    it(`exports ${basename}`, async function () {
      const totalRows = await analyzeAndImportCSV(null, filepath, dataService);
      const output = temp.createWriteStream();
      const result = await exportCSVFromQuery({
        ns: 'db.col',
        dataService,
        output,
      });
      const text = fs.readFileSync(output.path, 'utf8');
      console.log(text);
      expect(result).to.deep.equal({
        docsWritten: totalRows,
        aborted: false,
      });
    });
  }

  for (const [type, filepath] of Object.entries(fixtures.csvByType)) {
    // array and object relates to the structure, not the CSVfield types
    //if (['array', 'object'].includes(type)) {
    //  continue;
    //}

    // not all types are bi-directional (yet)
    /*
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
        'symbol',
      ].includes(type)
    ) {
      continue;
    }
    */

    if (type === 'symbol') {
      continue;
    }

    it(`correctly exports ${type}`, async function () {
      const totalRows = await analyzeAndImportCSV(type, filepath, dataService);
      const output = temp.createWriteStream();
      const result = await exportCSVFromQuery({
        ns: 'db.col',
        dataService,
        output,
      });
      const text = fs.readFileSync(output.path, 'utf8');
      console.log(text);
      expect(result).to.deep.equal({
        docsWritten: totalRows,
        aborted: false,
      });
    });
  }
});

async function analyzeAndImportCSV(
  type: string | null,
  filepath: string,
  dataService: DataService
) {
  const typeResult = await guessFileType({
    input: fs.createReadStream(filepath),
  });
  assert(typeResult.type === 'csv');

  const csvDelimiter = typeResult.csvDelimiter;
  const analyzeResult = await analyzeCSVFields({
    input: fs.createReadStream(filepath),
    delimiter: csvDelimiter,
    ignoreEmptyStrings: true,
  });

  const totalRows = analyzeResult.totalRows;
  const fields = _.mapValues(
    analyzeResult.fields,
    // For the date.csv file the date field is (correctly) detected as
    // "mixed" due to the mix of an iso date string and an int64 format
    // date. In that case the user would have to explicitly select Date to
    // make it a date which is what we're testing here.
    (field) => (type === 'date' ? 'date' : field.detected)
  );

  await importCSV({
    dataService,
    ns: 'db.col',
    fields,
    input: fs.createReadStream(filepath),
    delimiter: csvDelimiter,
    ignoreEmptyStrings: true,
  });

  return totalRows;
}
