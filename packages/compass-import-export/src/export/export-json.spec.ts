import os from 'os';
import { EJSON } from 'bson';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import temp from 'temp';

temp.track();

import { DataServiceImpl } from 'mongodb-data-service';

import { fixtures } from '../../test/fixtures';

import { exportJSON } from './export-json';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const testNS = 'export-json-test.test-col';

describe('exportJSON', function () {
  let dataService: DataServiceImpl;
  let dropCollection;
  let createCollection;
  let insertOne;
  let insertMany;
  let tmpdir: string;

  // Insert documents once for all of the tests.
  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      'compass-export-json-test',
      `test-${Date.now()}`
    );
    await fs.promises.mkdir(tmpdir, { recursive: true });

    dataService = new DataServiceImpl({
      connectionString: 'mongodb://localhost:27018/local',
    });

    dropCollection = promisify(dataService.dropCollection.bind(dataService));

    createCollection = promisify(
      dataService.createCollection.bind(dataService)
    );

    insertOne = promisify(dataService.insertOne.bind(dataService));
    insertMany = promisify(dataService.insertMany.bind(dataService));

    await dataService.connect();

    try {
      await dropCollection(testNS);
    } catch (err) {
      // ignore
    }
    await createCollection(testNS, {});
  });

  afterEach(async function () {
    await fs.promises.rm(tmpdir, { recursive: true });

    await dataService.disconnect();
  });

  it('exports to the output stream', async function () {
    await insertOne(testNS, { testDoc: true }, {});

    const abortController = new AbortController();
    const tempWriteStream = temp.createWriteStream();

    const result = await exportJSON({
      dataService,
      ns: testNS,
      fields: [],
      output: tempWriteStream,
      variant: 'default',
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    expect(result.docsWritten).to.equal(1);
    expect(tempWriteStream.bytesWritten).to.equal(78);
    expect(result.aborted).to.be.false;
  });

  for (const fixtureType of ['json', 'jsonl'] as const) {
    for (const filepath of Object.values(fixtures[fixtureType])) {
      const basename = path.basename(filepath);

      it(`exports ${basename}`, async function () {
        const abortController = new AbortController();
        const progressCallback = sinon.spy();

        const docsPath = filepath.replace(
          /\.((jsonl?)|(csv))$/,
          '.imported.ejson'
        );

        const resultPath = path.join(
          tmpdir,
          basename.replace(/\.((jsonl?)|(csv))$/, '.exported.ejson')
        );

        let importedText;
        let ejsonToInsert;
        let ejsonToInsertWithout_id; // insertMany mutates and adds _id to added docs when missing.
        try {
          importedText = await fs.promises.readFile(docsPath, 'utf8');
          ejsonToInsert = EJSON.parse(importedText);
          ejsonToInsertWithout_id = EJSON.parse(importedText);
          expect(ejsonToInsert).to.have.length.greaterThan(0);
        } catch (err) {
          // This helps to tell you which file is missing and what the expected
          // content is which helps when adding a new fixture.
          console.log(docsPath);
          console.log(importedText);
          throw err;
        }
        await insertMany(testNS, ejsonToInsert, {});

        const output = fs.createWriteStream(resultPath);
        const stats = await exportJSON({
          dataService,
          ns: testNS,
          output,
          abortSignal: abortController.signal,
          progressCallback,
          query: {
            filter: {},
          },
          variant: 'default',
        });

        expect(progressCallback.callCount).to.be.gt(0);
        const docsExported = progressCallback.callCount;
        expect(stats).to.deep.equal({
          aborted: false,
          docsWritten: docsExported,
        });

        const docs = await dataService.find(testNS, {});
        expect(docs).to.have.length.greaterThan(0);
        expect(docs).to.have.length(docsExported);

        let resultText;
        let writtenResultDocs;
        try {
          resultText = await fs.promises.readFile(resultPath, 'utf8');
          writtenResultDocs = EJSON.parse(resultText);
        } catch (err) {
          console.log(resultPath);
          throw err;
        }

        const expectedResultsPath = filepath.replace(
          /\.((jsonl?)|(csv))$/,
          '.exported.ejson'
        );

        let expectedText;
        try {
          expectedText = await fs.promises.readFile(
            expectedResultsPath,
            'utf8'
          );
        } catch (err) {
          console.log(expectedResultsPath);
          throw err;
        }

        // Remove newly created _id's as they won't match when we compare below.
        if (!ejsonToInsertWithout_id[0]._id) {
          for (const doc of writtenResultDocs) {
            if (doc._id && doc._id._bsontype === 'ObjectId') {
              delete doc._id;
            }
          }
          for (const doc of ejsonToInsertWithout_id) {
            if (doc._id && doc._id._bsontype === 'ObjectId') {
              delete doc._id;
            }
          }

          expectedText = expectedText.replace(/^ +"\$oid": ".*$/gm, 'ObjectId');
          resultText = resultText.replace(/^ +"\$oid": ".*$/gm, 'ObjectId');
        }

        expect(
          writtenResultDocs,
          basename.replace(/\.((jsonl?)|(csv))$/, '.exported.ejson')
        ).to.deep.equal(ejsonToInsertWithout_id);

        expect(
          resultText,
          basename.replace(/\.((jsonl?)|(csv))$/, '.exported.ejson')
        ).to.deep.equal(expectedText);
      });
    }
  }

  it('responds to abortSignal.aborted', async function () {
    const abortController = new AbortController();
    abortController.abort();

    const result = await exportJSON({
      dataService,
      ns: testNS,
      fields: [],
      output: temp.createWriteStream(),
      variant: 'default',
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    expect(result.docsWritten).to.equal(0);
    expect(result.aborted).to.be.true;
  });

  it('exports aggregations', async function () {
    const docs = ['pineapple', 'apple', 'orange', 'turtle'].map(
      (name, index) => ({
        counter: index,
        name,
      })
    );
    await insertMany(testNS, docs, {});

    const abortController = new AbortController();
    const resultPath = path.join(tmpdir, 'test-aggregations.exported.json');
    const output = fs.createWriteStream(resultPath);

    const result = await exportJSON({
      dataService,
      ns: testNS,
      aggregation: {
        stages: [
          {
            $match: {
              counter: {
                $lte: 2,
              },
            },
          },
          {
            $project: {
              name: 1,
              doubleName: '$name',
              _id: 0,
            },
          },
        ],
        options: {},
      },
      output,
      variant: 'default',
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    expect(result.docsWritten).to.equal(3);
    expect(result.aborted).to.be.false;

    let resultText;
    let writtenResultDocs;
    try {
      resultText = await fs.promises.readFile(resultPath, 'utf8');
      writtenResultDocs = EJSON.parse(resultText);
    } catch (err) {
      console.log(resultPath);
      throw err;
    }

    const expectedText = `[{
  "name": "pineapple",
  "doubleName": "pineapple"
},
{
  "name": "apple",
  "doubleName": "apple"
},
{
  "name": "orange",
  "doubleName": "orange"
}]`;

    expect(writtenResultDocs).to.deep.equal(
      ['pineapple', 'apple', 'orange'].map((name) => ({
        name,
        doubleName: name,
      }))
    );
    expect(resultText).to.deep.equal(expectedText);
  });

  // TODO: It exports different json variant formats
  // TODO: It exports/handles an empty collection

  // TODO: When data service errors.e
  // TODO: When write file errors.

  // TODO: It reports database errors
});
