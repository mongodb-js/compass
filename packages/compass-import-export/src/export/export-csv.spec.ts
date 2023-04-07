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

import type { CSVParsableFieldType } from '../csv/csv-types';
import { exportCSVFromQuery } from './export-csv';
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
  let insertMany: any;

  beforeEach(async function () {
    dataService = await connect({
      connectionString: 'mongodb://localhost:27018/local',
    });

    insertMany = promisify(dataService.insertMany.bind(dataService));

    try {
      await dataService.dropCollection('db.col');
    } catch (err) {
      // ignore
    }
    await dataService.createCollection('db.col', {});
  });

  afterEach(async function () {
    try {
      await dataService.disconnect();
    } catch (err) {
      // ignore
    }
  });

  // TODO: test constructing find queries and aggregations

  it('exports an empty collection', async function () {
    const output = temp.createWriteStream();
    const result = await exportCSVFromQuery({
      ns: 'db.col',
      dataService,
      output,
    });
    expect(result).to.deep.equal({
      docsWritten: 0,
      aborted: false,
    });

    const text = replaceId(await fs.promises.readFile(output.path, 'utf8'));
    // no columns, so just the linebreak at the end of the empty header row
    expect(text).to.equal('\n');
  });

  it('exports all bson types', async function () {
    await insertMany('db.col', allTypesDoc, {});

    const output = temp.createWriteStream();
    // TODO: exportCSVFromAggregation
    const result = await exportCSVFromQuery({
      ns: 'db.col',
      dataService,
      output,
    });
    expect(result).to.deep.equal({
      docsWritten: 1,
      aborted: false,
    });

    const expectedResultsPath = fixtures.allTypes.replace(
      /\.js$/,
      '.exported.csv'
    );
    await compareText(output.path, expectedResultsPath);
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
        // TODO: exportCSVFromAggregation
        const result = await exportCSVFromQuery({
          ns: 'db.col',
          dataService,
          output,
        });

        expect(result).to.deep.equal({
          docsWritten,
          aborted: false,
        });

        const expectedResultsPath = filepath.replace(
          /\.((jsonl?)|(csv))$/,
          '.exported.csv'
        );
        await compareText(output.path, expectedResultsPath);
      });
    }
  }

  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);

    if (basename === 'bad.csv') {
      // skipping this one because the _id is at the end and that makes it awkward for the current implementation of replaceId
      continue;
    }

    it(`exports ${basename}`, async function () {
      const totalRows = await analyzeAndImportCSV(null, filepath, dataService);
      const output = temp.createWriteStream();
      // TODO: exportCSVFromAggregation
      const result = await exportCSVFromQuery({
        ns: 'db.col',
        dataService,
        output,
      });
      expect(result).to.deep.equal({
        docsWritten: totalRows,
        aborted: false,
      });

      const expectedResultsPath = filepath.replace(
        /\.((jsonl?)|(csv))$/,
        '.exported.csv'
      );
      await compareText(output.path, expectedResultsPath);
    });
  }

  for (const [type, filepath] of Object.entries(fixtures.csvByType)) {
    // array and object relates to the structure, not the CSVfield types
    if (['array', 'object'].includes(type)) {
      continue;
    }

    it(`correctly exports ${type}`, async function () {
      // TODO: set the field types if necessary just like how the user would
      const totalRows = await analyzeAndImportCSV(type, filepath, dataService);
      const output = temp.createWriteStream();
      // TODO: exportCSVFromAggregation
      const result = await exportCSVFromQuery({
        ns: 'db.col',
        dataService,
        output,
      });
      expect(result).to.deep.equal({
        docsWritten: totalRows,
        aborted: false,
      });

      const expectedResultsPath = filepath.replace(
        /\.((jsonl?)|(csv))$/,
        '.exported.csv'
      );
      await compareText(output.path, expectedResultsPath);
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
  const fields = _.mapValues(analyzeResult.fields, (field, name) => {
    if (['something', 'something_else', 'notes'].includes(name)) {
      return field.detected;
    }

    // For the date.csv file the date field is (correctly) detected as
    // "mixed" due to the mix of an iso date string and an int64 format
    // date. In that case the user would have to explicitly select Date to
    // make it a date which is what we're testing here.
    if (type === 'date') {
      return 'date';
    }

    // Some types we can't detect, but we can parse it if the user
    // manually selects it.
    // TODO: md5
    if (
      type &&
      ['binData', 'decimal', 'objectId', 'timestamp'].includes(type)
    ) {
      return type as CSVParsableFieldType;
    }

    return field.detected;
  });

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

function replaceId(text: string): string {
  // If the fixture didn't have an _id, then mongodb will add one when each doc
  // gets inserted. This means each doc will have a random unique id. In order
  // to make that comparable we just replace them all with the line number.
  const lines = text.split(/\n/g);

  if (lines[0].startsWith('_id,')) {
    for (const [index, line] of lines.entries()) {
      if (index === 0) {
        continue;
      }
      lines[index] = line.replace(/^\w{24},/, `${index},`);
    }
  }

  return lines.join('\n');
}

async function compareText(inputPath: string | Buffer, expectedPath: string) {
  const text = replaceId(await fs.promises.readFile(inputPath, 'utf8'));

  let expectedText: string;
  try {
    expectedText = replaceId(await fs.promises.readFile(expectedPath, 'utf8'));
  } catch (err) {
    console.log(expectedPath);
    console.log(text);
    throw err;
  }

  try {
    const inputLines = text.split(/\n/g);
    const expectedLines = expectedText.split(/\n/g);

    expect(inputLines.length).to.equal(expectedLines.length);

    for (const [index, line] of inputLines.entries()) {
      const expectedLine = expectedLines[index];
      expect(line.length, index.toString()).to.equal(expectedLine.length);
      expect(line, index.toString()).to.equal(expectedLine);
    }

    expect(text).to.deep.equal(expectedText);
  } catch (err) {
    console.log(expectedPath);
    console.log(text);
    throw err;
  }
}
