/* eslint-disable mocha/max-top-level-suites */
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import type { Document } from 'bson';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { connect } from 'mongodb-data-service';
import type { DataService } from 'mongodb-data-service';

import { fixtures } from '../../test/fixtures';

import { importJSON } from '../import/import-json';
import {
  gatherFieldsFromQuery,
  createProjectionFromSchemaFields,
  gatherFieldsFromAggregation,
} from './gather-fields';

import allTypesDoc from '../../test/docs/all-bson-types';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const testNS = 'gather-fields-test.test-col';

describe('gatherFields', function () {
  let dataService: DataService;
  let insertMany: any;

  beforeEach(async function () {
    dataService = await connect({
      connectionString: 'mongodb://localhost:27018/local',
    });

    insertMany = promisify(dataService.insertMany.bind(dataService));

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
    const docs: Document = [];
    for (let i = 0; i < 1000; i++) {
      docs.push({ i, name: `name-${leadingZeroes(i, 4)}` });
    }
    await insertMany(testNS, docs, {});
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
      const docs: Document = [];
      for (let i = 0; i < 1001; i++) {
        docs.push({ i });
      }
      await insertMany(testNS, docs, {});

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
      const docs: Document = [];
      for (let i = 0; i < 26; i++) {
        const doc: Document = { index: i };
        const letter = String.fromCharCode('a'.charCodeAt(0) + i);
        doc[letter] = true;
        docs.push(doc);
      }
      await insertMany(testNS, docs, {});

      const result = await gatherFieldsFromQuery({
        ns: testNS,
        query: {
          filter: { index: { $gt: 1 } },
          skip: 10,
          limit: 10,
          sort: {
            index: -1,
          },
          projection: { _id: false },
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

  describe('gatherFieldsFromAggregation', function () {
    it('gathers the fields for an empty collection', async function () {
      const result = await gatherFieldsFromAggregation({
        ns: testNS,
        aggregation: { stages: [] },
        dataService,
      });

      expect(result).to.deep.equal({
        aborted: false,
        docsProcessed: 0,
        paths: [],
      });
    });

    it('gathers fields for an aggregation', async function () {
      await insertDocs();

      const result = await gatherFieldsFromAggregation({
        ns: testNS,
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
        dataService,
      });

      expect(result).to.deep.equal({
        aborted: false,
        docsProcessed: 1,
        paths: [['count']],
      });
    });
  });

  it('gathers all bson types', async function () {
    await insertMany(testNS, allTypesDoc, {});

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
    expect(createProjectionFromSchemaFields([])).to.deep.equal({});

    expect(createProjectionFromSchemaFields([['foo']])).to.deep.equal({
      foo: true,
    });

    expect(
      createProjectionFromSchemaFields([['foo'], ['foo', 'bar']])
    ).to.deep.equal({ foo: true });

    expect(
      createProjectionFromSchemaFields([['foo', 'bar'], ['foo']])
    ).to.deep.equal({ foo: true });

    expect(
      createProjectionFromSchemaFields([
        ['fruit', 'banana'],
        ['fruit', 'pineapple'],
      ])
    ).to.deep.equal({
      fruit: {
        banana: true,
        pineapple: true,
      },
    });

    expect(
      createProjectionFromSchemaFields([['pen', 'pineapple', 'apple', 'pen']])
    ).to.deep.equal({
      pen: {
        pineapple: {
          apple: {
            pen: true,
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
