/* eslint-disable no-console */
import _ from 'lodash';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { Readable, Writable } from 'stream';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import temp from 'temp';
import type { Document } from 'bson';
import type { FindCursor } from 'mongodb';

temp.track();

import type { DataService } from 'mongodb-data-service';
import { connect } from 'mongodb-data-service';

import { fixtures } from '../../test/fixtures';

import type { CSVParsableFieldType } from '../csv/csv-types';
import type { CSVExportPhase } from '../export/export-csv';
import { exportCSVFromAggregation, exportCSVFromQuery } from './export-csv';
import { guessFileType } from '../import/guess-filetype';
import { analyzeCSVFields } from '../import/analyze-csv-fields';
import { importCSV } from '../import/import-csv';
import { importJSON } from '../import/import-json';

import allTypesDoc from '../../test/docs/all-bson-types';
import { mochaTestServer } from '@mongodb-js/compass-test-server';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('exportCSV', function () {
  const cluster = mochaTestServer();
  let dataService: DataService;

  beforeEach(async function () {
    dataService = await connect({
      connectionOptions: {
        connectionString: cluster().connectionString,
      },
    });

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

  it('exports an empty collection', async function () {
    const progressCallback = sinon.spy();

    const output = temp.createWriteStream();
    const result = await exportCSVFromQuery({
      ns: 'db.col',
      dataService,
      output,
      progressCallback,
    });
    expect(result).to.deep.equal({
      docsWritten: 0,
      aborted: false,
    });

    const text = replaceId(await fs.promises.readFile(output.path, 'utf8'));
    // no columns, so just the linebreak at the end of the empty header row
    expect(text).to.equal('\n');

    expect(progressCallback).to.have.callCount(0);
  });

  it('exports all bson types', async function () {
    const progressCallback = sinon.spy();

    await dataService.insertMany('db.col', allTypesDoc);

    const output = temp.createWriteStream();
    const result = await exportCSVFromQuery({
      ns: 'db.col',
      dataService,
      output,
      progressCallback,
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

    expect(progressCallback).to.have.callCount(2);
    expect(progressCallback.args).to.deep.equal([
      [1, 'DOWNLOAD'],
      [1, 'WRITE'],
    ]);
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
      const totalRows = await analyzeAndImportCSV(type, filepath, dataService);
      const output = temp.createWriteStream();
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

  function leadingZeroes(num: number, size: number): string {
    return `000000000${num}`.slice(-size);
  }

  async function insertDocs() {
    const docs: Document[] = [];
    for (let i = 0; i < 1000; i++) {
      docs.push({ i, name: `name-${leadingZeroes(i, 4)}` });
    }
    await dataService.insertMany('db.col', docs);
  }

  it('exports find queries', async function () {
    await insertDocs();

    const output = temp.createWriteStream();

    const result = await exportCSVFromQuery({
      ns: 'db.col',
      dataService,
      query: {
        filter: { i: { $lt: 990 } },
        projection: { _id: 0, name: 1 },
        sort: { name: -1 },
        limit: 10,
        skip: 10,
      },
      output,
    });

    expect(result).to.deep.equal({
      docsWritten: 10,
      aborted: false,
    });

    const text = await fs.promises.readFile(output.path, 'utf8');

    const names: string[] = [];
    for (let i = 979; i >= 970; i--) {
      names.push(`name-${leadingZeroes(i, 4)}`);
    }
    const expectedText = `name\n${names.join('\n')}\n`;
    expect(text).to.equal(expectedText);
  });

  it('exports aggregations', async function () {
    await insertDocs();

    const output = temp.createWriteStream();

    const result = await exportCSVFromAggregation({
      ns: 'db.col',
      dataService,
      aggregation: {
        stages: [
          {
            $group: {
              _id: null,
              count: { $count: {} },
            },
          },
          {
            $project: {
              _id: 0,
            },
          },
        ],
        options: {},
      },
      output,
    });

    expect(result).to.deep.equal({
      docsWritten: 1,
      aborted: false,
    });

    const text = await fs.promises.readFile(output.path, 'utf8');

    const expectedText = 'count\n1000\n';
    expect(text).to.equal(expectedText);
  });

  it('responds to abortSignal.aborted (download phase, find)', async function () {
    await insertDocs();

    const abortController = new AbortController();
    abortController.abort();

    const result = await exportCSVFromQuery({
      dataService,
      ns: 'db.col',
      output: temp.createWriteStream(),
      abortSignal: abortController.signal,
    });

    expect(result).to.deep.equal({
      docsWritten: 0,
      aborted: true,
    });
  });

  it('responds to abortSignal.aborted (write phase, find)', async function () {
    await insertDocs();

    const abortController = new AbortController();
    const progressCallback = function (index: number, phase: CSVExportPhase) {
      if (phase === 'WRITE') {
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
      }
    };

    const result = await exportCSVFromQuery({
      dataService,
      ns: 'db.col',
      output: temp.createWriteStream(),
      abortSignal: abortController.signal,
      progressCallback,
    });

    expect(result).to.deep.equal({
      docsWritten: 1,
      aborted: true,
    });
  });

  it('responds to abortSignal.aborted (download phase, aggregate)', async function () {
    await insertDocs();

    const abortController = new AbortController();
    abortController.abort();

    const result = await exportCSVFromAggregation({
      dataService,
      ns: 'db.col',
      output: temp.createWriteStream(),
      abortSignal: abortController.signal,
      aggregation: {
        stages: [
          {
            $project: {
              _id: 0,
            },
          },
        ],
        options: {},
      },
    });

    expect(result).to.deep.equal({
      docsWritten: 0,
      aborted: true,
    });
  });

  it('responds to abortSignal.aborted (write phase, aggregate)', async function () {
    await insertDocs();

    const abortController = new AbortController();
    const progressCallback = function (index: number, phase: CSVExportPhase) {
      if (phase === 'WRITE') {
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
      }
    };

    const result = await exportCSVFromAggregation({
      dataService,
      ns: 'db.col',
      output: temp.createWriteStream(),
      abortSignal: abortController.signal,
      aggregation: {
        stages: [
          {
            $project: {
              _id: 0,
            },
          },
        ],
        options: {},
      },
      progressCallback,
    });

    expect(result).to.deep.equal({
      docsWritten: 1,
      aborted: true,
    });
  });

  it('throws when the database stream errors', async function () {
    const abortController = new AbortController();

    const mockReadStream = new Readable({
      objectMode: true,
      read: function () {
        this.emit('error', new Error('example error cannot fetch docs'));
      },
    });

    sinon.stub(dataService, 'findCursor').returns({
      stream: () => mockReadStream,
      close: () => {},
    } as unknown as FindCursor);

    await expect(
      exportCSVFromQuery({
        dataService,
        ns: 'db.col',
        output: temp.createWriteStream(),
        abortSignal: abortController.signal,
      })
    ).to.be.rejectedWith(Error, 'example error cannot fetch docs');
  });

  it('throws when the write output errors', async function () {
    await insertDocs();
    const abortController = new AbortController();

    const mockWriteStream = new Writable({
      write() {
        this.emit('error', new Error('example error cannot write to file'));
      },
    });

    await expect(
      exportCSVFromQuery({
        dataService,
        ns: 'db.col',
        output: mockWriteStream,
        abortSignal: abortController.signal,
      })
    ).to.be.rejectedWith(Error, 'example error cannot write to file');
  });
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
  const newline = typeResult.newline;
  const analyzeResult = await analyzeCSVFields({
    input: fs.createReadStream(filepath),
    delimiter: csvDelimiter,
    newline,
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
    if (
      type &&
      ['binData', 'decimal', 'objectId', 'timestamp', 'md5'].includes(type)
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
    newline,
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
