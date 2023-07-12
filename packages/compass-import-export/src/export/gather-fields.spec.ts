/* eslint-disable no-console */
/* eslint-disable mocha/max-top-level-suites */
import _ from 'lodash';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import type { Document } from 'bson';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { connect } from 'mongodb-data-service';
import type { DataService } from 'mongodb-data-service';

import type { CSVParsableFieldType } from '../csv/csv-types';
import { guessFileType } from '../import/guess-filetype';
import { importCSV } from '../import/import-csv';
import { analyzeCSVFields } from '../import/analyze-csv-fields';

import { fixtures } from '../../test/fixtures';

import { importJSON } from '../import/import-json';
import {
  gatherFieldsFromQuery,
  createProjectionFromSchemaFields,
} from './gather-fields';

import allTypesDoc from '../../test/docs/all-bson-types';
import { mochaTestServer } from '@mongodb-js/compass-test-server';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const testNS = 'gather-fields-test.test-col';

describe('gatherFields', function () {
  const cluster = mochaTestServer();
  let dataService: DataService;

  beforeEach(async function () {
    dataService = await connect({
      connectionOptions: {
        connectionString: cluster().connectionString,
      },
    });

    try {
      await dataService.dropCollection(testNS);
    } catch (err) {
      // ignore
    }
    await dataService.createCollection(testNS, {});
  });

  afterEach(async function () {
    try {
      await dataService.disconnect();
    } catch (err) {
      // ignore
    }
  });

  function leadingZeroes(num: number, size: number): string {
    return `000000000${num}`.slice(-size);
  }

  async function insertDocs() {
    const docs: Document[] = [];
    for (let i = 0; i < 1000; i++) {
      docs.push({ i, name: `name-${leadingZeroes(i, 4)}` });
    }
    await dataService.insertMany(testNS, docs);
  }

  describe('gatherFieldsFromQuery', function () {
    it('gathers the fields for an empty collection', async function () {
      const result = await gatherFieldsFromQuery({
        ns: testNS,
        query: { filter: {} },
        dataService,
      });

      expect(result).to.deep.equal({
        aborted: false,
        docsProcessed: 0,
        paths: [],
      });
    });

    it('treats sampleSize as optional', async function () {
      const docs: Document[] = [];
      for (let i = 0; i < 1001; i++) {
        docs.push({ i });
      }
      await dataService.insertMany(testNS, docs);

      const result = await gatherFieldsFromQuery({
        ns: testNS,
        query: { filter: {} },
        dataService,
      });

      expect(result).to.deep.equal({
        aborted: false,
        docsProcessed: 1001,
        paths: [['_id'], ['i']],
      });
    });

    it('works with all find parameters', async function () {
      const docs: Document[] = [];
      for (let i = 0; i < 26; i++) {
        const doc: Document = { index: i };
        const letter = String.fromCharCode('a'.charCodeAt(0) + i);
        doc[letter] = true;
        docs.push(doc);
      }
      await dataService.insertMany(testNS, docs);

      const result = await gatherFieldsFromQuery({
        ns: testNS,
        query: {
          filter: { index: { $gt: 1 } },
          skip: 10,
          limit: 10,
          sort: {
            index: -1,
          },
          projection: { _id: 0 },
        },
        dataService,
      });

      expect(result).to.deep.equal({
        aborted: false,
        docsProcessed: 10,
        // paths are unaffected by the sort order because the schema analyzer will sort them anyway
        paths: [
          ['g'],
          ['h'],
          ['i'],
          ['index'],
          ['j'],
          ['k'],
          ['l'],
          ['m'],
          ['n'],
          ['o'],
          ['p'],
        ],
      });
    });
  });

  it('gathers all bson types', async function () {
    await dataService.insertMany(testNS, allTypesDoc, {});

    const abortController = new AbortController();
    const abortSignal = abortController.signal;
    const progressCallback = sinon.spy();

    const result = await gatherFieldsFromQuery({
      abortSignal,
      progressCallback,
      ns: testNS,
      query: { filter: {} },
      sampleSize: 1000,
      dataService,
    });

    const expectedResultPath = fixtures.allTypes.replace(
      /\.js$/,
      '.gathered.json'
    );
    await compareResult(result, expectedResultPath);
  });

  for (const jsonVariant of ['json', 'jsonl'] as const) {
    for (const filepath of Object.values(
      fixtures[jsonVariant] as Record<string, string>
    )) {
      const basename = path.basename(filepath);

      it(`gathers the fields for ${basename}`, async function () {
        const { docsWritten } = await importJSON({
          dataService,
          ns: testNS,
          input: fs.createReadStream(filepath),
          jsonVariant,
        });

        // sanity check
        expect(docsWritten).to.be.gt(0);

        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        const progressCallback = sinon.spy();

        const result = await gatherFieldsFromQuery({
          abortSignal,
          progressCallback,
          ns: testNS,
          query: { filter: {} },
          sampleSize: 1000,
          dataService,
        });

        expect(progressCallback).to.callCount(docsWritten);

        for (const [index, args] of progressCallback.args.entries()) {
          expect(args[0]).to.equal(index + 1);
        }

        const expectedResultPath = filepath.replace(
          /\.((jsonl?)|(csv))$/,
          '.gathered.json'
        );
        await compareResult(result, expectedResultPath);
      });
    }
  }

  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);

    it(`gathers the fields for ${basename}`, async function () {
      const totalRows = await analyzeAndImportCSV(null, filepath, dataService);

      // sanity check
      expect(totalRows).to.be.gt(0);

      const abortController = new AbortController();
      const abortSignal = abortController.signal;
      const progressCallback = sinon.spy();

      const result = await gatherFieldsFromQuery({
        abortSignal,
        progressCallback,
        ns: testNS,
        query: { filter: {} },
        sampleSize: 1000,
        dataService,
      });

      expect(progressCallback).to.callCount(totalRows);

      for (const [index, args] of progressCallback.args.entries()) {
        expect(args[0]).to.equal(index + 1);
      }

      const expectedResultPath = filepath.replace(
        /\.((jsonl?)|(csv))$/,
        '.gathered.json'
      );
      await compareResult(result, expectedResultPath);
    });
  }

  it('responds to abortSignal.aborted', async function () {
    await insertDocs();

    const abortController = new AbortController();
    const progressCallback = function () {
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };

    const result = await gatherFieldsFromQuery({
      dataService,
      ns: testNS,
      abortSignal: abortController.signal,
      progressCallback,
    });

    expect(result).to.deep.equal({
      docsProcessed: 1,
      aborted: true,
      paths: [['_id'], ['i'], ['name']],
    });
  });
});

describe('createProjectionFromSchemaFields', function () {
  it('builds projections', function () {
    expect(createProjectionFromSchemaFields([])).to.deep.equal({
      _id: 0,
    });

    expect(createProjectionFromSchemaFields([['foo']])).to.deep.equal({
      _id: 0,
      foo: 1,
    });

    expect(
      createProjectionFromSchemaFields([['foo'], ['foo', 'bar']])
    ).to.deep.equal({ foo: 1, _id: 0 });

    expect(
      createProjectionFromSchemaFields([['foo', 'bar'], ['foo']])
    ).to.deep.equal({ foo: 1, _id: 0 });

    expect(createProjectionFromSchemaFields([['_id'], ['foo']])).to.deep.equal({
      foo: 1,
      _id: 1,
    });

    expect(
      createProjectionFromSchemaFields([
        ['fruit', 'banana'],
        ['fruit', 'pineapple'],
      ])
    ).to.deep.equal({
      _id: 0,
      fruit: {
        banana: 1,
        pineapple: 1,
      },
    });

    expect(
      createProjectionFromSchemaFields([['pen', 'pineapple', 'apple', 'pen']])
    ).to.deep.equal({
      _id: 0,
      pen: {
        pineapple: {
          apple: {
            pen: 1,
          },
        },
      },
    });
  });
});

async function compareResult(result: any, expectedPath: string) {
  // test the projection while at it
  result.projection = createProjectionFromSchemaFields(result.paths);

  let expectedText: string;
  let expectedResult: any;
  try {
    expectedText = await fs.promises.readFile(expectedPath, 'utf8');
    expectedResult = JSON.parse(expectedText);
  } catch (err) {
    console.log(expectedPath);
    console.log(JSON.stringify(result, null, 2));
    throw err;
  }

  try {
    expect(result).to.deep.equal(expectedResult);
  } catch (err) {
    console.log(expectedPath);
    console.log(JSON.stringify(result, null, 2));
    throw err;
  }
}

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
    ns: testNS,
    fields,
    newline,
    input: fs.createReadStream(filepath),
    delimiter: csvDelimiter,
    ignoreEmptyStrings: true,
  });

  return totalRows;
}
