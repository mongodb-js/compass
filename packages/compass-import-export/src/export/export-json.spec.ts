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
import { connect } from 'mongodb-data-service';
import type { DataService } from 'mongodb-data-service';
import { Readable, Writable } from 'stream';
import type { FindCursor } from 'mongodb';

temp.track();

import { fixtures } from '../../test/fixtures';

import { exportJSON } from './export-json';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const testDB = 'export-json-test';
const testNS = `${testDB}.test-col`;

describe('exportJSON', function () {
  let dataService: DataService;
  let dropCollection;
  let createCollection;
  let insertOne: any;
  let insertMany: any;
  let tmpdir: string;

  // Insert documents once for all of the tests.
  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      'compass-export-json-test',
      `test-${Date.now()}`
    );
    await fs.promises.mkdir(tmpdir, { recursive: true });

    dataService = await connect({
      connectionString: 'mongodb://localhost:27018/local',
    });

    dropCollection = promisify(dataService.dropCollection.bind(dataService));

    createCollection = promisify(
      dataService.createCollection.bind(dataService)
    );

    insertOne = promisify(dataService.insertOne.bind(dataService));
    insertMany = promisify(dataService.insertMany.bind(dataService));

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
    sinon.restore();
  });

  it('exports to the output stream', async function () {
    await insertOne(testNS, { testDoc: true }, {});

    const abortController = new AbortController();
    const tempWriteStream = temp.createWriteStream();

    const result = await exportJSON({
      dataService,
      ns: testNS,
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

  it('handles an empty collection', async function () {
    const abortController = new AbortController();

    const resultPath = path.join(tmpdir, 'test-empty.exported.ejson');

    const output = fs.createWriteStream(resultPath);
    const result = await exportJSON({
      dataService,
      ns: `${testDB}.test-empty`,
      output,
      variant: 'default',
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    expect(result.docsWritten).to.equal(0);
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

    const expectedText = '[]';

    expect(writtenResultDocs).to.deep.equal([]);
    expect(resultText).to.deep.equal(expectedText);
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
    } as unknown as FindCursor);

    try {
      await exportJSON({
        dataService,
        ns: testNS,
        output: temp.createWriteStream(),
        variant: 'default',
        abortSignal: abortController.signal,
        progressCallback: () => {},
      });

      throw new Error('did not expect export to succeed');
    } catch (err: any) {
      expect(err.message).to.equal('example error cannot fetch docs');
    }
  });

  it('throws when the write output errors', async function () {
    await insertOne(testNS, { testDoc: true }, {});
    const abortController = new AbortController();

    const mockWriteStream = new Writable({
      write() {
        this.emit('error', new Error('example error cannot write to file'));
      },
    });

    try {
      await exportJSON({
        dataService,
        ns: testNS,
        output: mockWriteStream,
        variant: 'default',
        abortSignal: abortController.signal,
        progressCallback: () => {},
      });

      throw new Error('expected to throw');
    } catch (err: any) {
      expect(err.message).to.equal('example error cannot write to file');
    }
  });

  it('exports with a projection', async function () {
    const docs = ['pineapple', 'apple', 'orange', 'turtle'].map(
      (name, index) => ({
        counter: index,
        name,
      })
    );
    await insertMany(testNS, docs, {});
    await insertOne(testNS, { testDoc: true }, {});

    const resultPath = path.join(
      tmpdir,
      'test-export-projection.exported.ejson'
    );
    const output = fs.createWriteStream(resultPath);
    const abortController = new AbortController();

    const result = await exportJSON({
      dataService,
      ns: testNS,
      output,
      query: {
        filter: {
          name: {
            $exists: true,
          },
        },
        sort: {
          name: 1,
        },
        limit: 2,
        skip: 1,
        projection: {
          _id: 0,
          name: 1,
        },
      },
      variant: 'default',
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    expect(result.docsWritten).to.equal(2);
    expect(result.aborted).to.be.false;

    let resultText;
    try {
      resultText = await fs.promises.readFile(resultPath, 'utf8');
    } catch (err) {
      console.log(resultPath);
      throw err;
    }

    const expectedText = `[{
  "name": "orange"
},
{
  "name": "pineapple"
}]`;
    expect(resultText).to.deep.equal(expectedText);
  });

  // TODO(COMPASS-6611): It exports different json variant formats
});
