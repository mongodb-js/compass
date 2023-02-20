import os from 'os';
// import assert from 'assert';
import { EJSON } from 'bson';
// import type { Document } from 'bson';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
// import { Readable } from 'stream';
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

    // TODO: more tests, more docs
    await insertOne(
      testNS,
      {
        testDoc: true,
      },
      {}
    );
  });

  afterEach(async function () {
    await fs.promises.rm(tmpdir, { recursive: true });

    await dataService.disconnect();
  });

  it('exports', async function () {
    // const fileName = 'test.json';

    const ns = testNS;
    const abortController = new AbortController();

    const tempWriteStream = temp.createWriteStream();

    const result = await exportJSON({
      dataService,
      ns,
      fields: [],
      // input: collection,// TODO: collection stream instead of passing query/agg?
      // aggregation: false,
      output: tempWriteStream,
      variant: 'default',
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    expect(tempWriteStream.bytesWritten).to.equal(60);
    expect(result.docsWritten).to.equal(1);
    expect(result.aborted).to.be.false;
  });

  for (const fixtureType of ['json', 'jsonl'] as const) {
    for (const filepath of Object.values(fixtures[fixtureType])) {
      const basename = path.basename(filepath);

      it(`exports ${basename}`, async function () {
        const abortController = new AbortController();
        const progressCallback = sinon.spy();

        let importedText;
        let ejsonToInsert;
        const docsPath = filepath.replace(
          /\.((jsonl?)|(csv))$/,
          '.imported.ejson'
        );

        const resultPath = path.join(
          tmpdir,
          basename.replace(/\.((jsonl?)|(csv))$/, '.exported.ejson')
        );
        // const output = temp.createWriteStream();
        const output = fs.createWriteStream(
          resultPath
          // Buffer.from('H4sIAAAAAAAAA8pIzcnJVyjPL8pJUQQAAAD//w==', 'base64')
        );

        try {
          importedText = await fs.promises.readFile(docsPath, 'utf8');
          ejsonToInsert = EJSON.parse(importedText);
        } catch (err) {
          // This helps to tell you which file is missing and what the expected
          // content is which helps when adding a new fixture.
          console.log(docsPath);
          console.log(importedText);
          throw err;
        }
        await insertMany(testNS, ejsonToInsert, {});

        const stats = await exportJSON({
          dataService,
          ns: testNS,
          // tempWriteStream
          // input: fs.createReadStream(filepath),
          output,
          abortSignal: abortController.signal,
          progressCallback,
          variant: 'default', // TODO: Test all 3.
          // variant: fixtureType,
        });

        expect(progressCallback.callCount).to.be.gt(0);

        const docsExported = progressCallback.callCount;

        expect(stats).to.deep.equal({
          aborted: false,
          docsWritten: docsExported,
        });

        const docs = await dataService.find(testNS, {});

        // console.log('docs in', JSON.stringify(docs));

        expect(docs).to.have.length.greaterThan(0);
        expect(docs).to.have.length(docsExported);

        // Remove _id's as they won't match when we compare below.
        for (const doc of docs) {
          if (doc._id && doc._id._bsontype === 'ObjectId') {
            delete doc._id;
          }
        }

        let resultText;
        try {
          resultText = await fs.promises.readFile(resultPath, 'utf8');
        } catch (err) {
          console.log(resultPath);
          throw err;
        }

        console.log(resultPath);
        console.log('resultText\n\n', resultText, '\n\n');

        const expectedResult = EJSON.parse(resultText);
        expect(
          docs,
          basename.replace(/\.((jsonl?)|(csv))$/, '.exported.ejson')
        ).to.deep.equal(expectedResult);
        expect(
          resultText,
          basename.replace(/\.((jsonl?)|(csv))$/, '.exported.ejson')
        ).to.deep.equal(importedText);
      });
    }
  }

  it('responds to abortSignal.aborted', async function () {
    // const fileName = 'aborted-signal-test-output.json';

    const ns = testNS;
    const abortController = new AbortController();
    abortController.abort();

    const result = await exportJSON({
      dataService,
      ns,
      fields: [],
      // input: collection,// TODO: collection stream
      // aggregation: false,
      output: temp.createWriteStream(),
      variant: 'default',
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    expect(result.docsWritten).to.equal(0);
    expect(result.aborted).to.be.true;
  });

  // TODO: It export different types
  // TODO: It exports nested docs
  // TODO: It export nested arrays

  // TODO: It exports different json formats (ejson etc)
  // TODO: It exports/handles an empty collection

  // TODO: it exports aggregations

  // TODO: When data service errors.e
  // TODO: When write file errors.

  // TODO: It reports database errors
  // TODO: it responds to abortSignal.aborted

  // TODO: EOF
});
