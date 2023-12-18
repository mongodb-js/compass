/* eslint-disable no-console */
import os from 'os';
import { EJSON, Long } from 'bson';
import fs from 'fs';
import path from 'path';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import temp from 'temp';
import { connect } from 'mongodb-data-service';
import type { DataService } from 'mongodb-data-service';
import { Readable, Writable } from 'stream';
import type { FindCursor } from 'mongodb';

import allTypesDocs from '../../test/docs/all-bson-types';

temp.track();

import { fixtures } from '../../test/fixtures';

import { exportJSONFromQuery, exportJSONFromAggregation } from './export-json';
import { mochaTestServer } from '@mongodb-js/compass-test-server';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

const testDB = 'export-json-test';
const testNS = `${testDB}.test-col`;

function replaceIds(text: string) {
  return text.replace(
    /"\$oid": "\w{24}"/g,
    '"$oid": "123456789012345678901234"'
  );
}

describe('exportJSON', function () {
  const cluster = mochaTestServer();
  let dataService: DataService;
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
    await fs.promises.rm(tmpdir, { recursive: true });

    await dataService.disconnect();
    sinon.restore();
  });

  it('exports to the output stream', async function () {
    await dataService.insertOne(testNS, { testDoc: true });

    const abortController = new AbortController();
    const tempWriteStream = temp.createWriteStream();

    const result = await exportJSONFromQuery({
      dataService,
      ns: testNS,
      output: tempWriteStream,
      variant: 'default',
      abortSignal: abortController.signal,
    });

    expect(result.docsWritten).to.equal(1);
    expect(tempWriteStream.bytesWritten).to.equal(78);
    expect(result.aborted).to.be.false;
  });

  for (const variant of ['default', 'relaxed', 'canonical'] as const) {
    it(`exports all types for variant=${variant}`, async function () {
      await dataService.insertMany(testNS, allTypesDocs);

      const tempWriteStream = temp.createWriteStream();

      const result = await exportJSONFromQuery({
        dataService,
        ns: testNS,
        output: tempWriteStream,
        variant,
      });

      expect(result).to.deep.equal({
        aborted: false,
        docsWritten: 1,
      });

      const text = replaceIds(
        await fs.promises.readFile(tempWriteStream.path, 'utf8')
      );
      const docs = EJSON.parse(text);

      const expectedPath = fixtures.allTypes.replace(
        /\.js$/,
        `.exported.${variant}.ejson`
      );
      let expectedText;
      let expectedDocs;
      try {
        expectedText = replaceIds(
          await fs.promises.readFile(expectedPath, 'utf8')
        );
        expectedDocs = EJSON.parse(expectedText);
      } catch (err) {
        console.log(expectedPath);
        console.log(text);
        throw err;
      }

      try {
        expect(text).to.deep.equal(expectedText);
      } catch (err) {
        console.log(text);
        throw err;
      }
      expect(docs).to.deep.equal(expectedDocs);
    });
  }

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
        await dataService.insertMany(testNS, ejsonToInsert);

        const output = fs.createWriteStream(resultPath);
        const stats = await exportJSONFromQuery({
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
          console.log(resultText);
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

    const resultPath = path.join(tmpdir, 'test-abort.exported.ejson');

    const output = fs.createWriteStream(resultPath);
    const result = await exportJSONFromQuery({
      dataService,
      ns: testNS,
      output,
      variant: 'default',
      abortSignal: abortController.signal,
    });

    expect(result.docsWritten).to.equal(0);
    expect(result.aborted).to.be.true;

    let resultText;
    try {
      resultText = await fs.promises.readFile(resultPath, 'utf8');
    } catch (err) {
      console.log(resultPath);
      throw err;
    }

    const expectedText = '';
    expect(resultText).to.deep.equal(expectedText);
  });

  it('exports aggregations', async function () {
    const docs = ['pineapple', 'apple', 'orange', 'turtle'].map(
      (name, index) => ({
        counter: index,
        name,
      })
    );
    await dataService.insertMany(testNS, docs);

    const abortController = new AbortController();
    const resultPath = path.join(tmpdir, 'test-aggregations.exported.json');
    const output = fs.createWriteStream(resultPath);

    const result = await exportJSONFromAggregation({
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
    const result = await exportJSONFromQuery({
      dataService,
      ns: `${testDB}.test-empty`,
      output,
      variant: 'default',
      abortSignal: abortController.signal,
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
      close: () => {},
    } as unknown as FindCursor);

    await expect(
      exportJSONFromQuery({
        dataService,
        ns: testNS,
        output: temp.createWriteStream(),
        variant: 'default',
        abortSignal: abortController.signal,
      })
    ).to.be.rejectedWith(Error, 'example error cannot fetch docs');
  });

  it('throws when the write output errors', async function () {
    await dataService.insertOne(testNS, { testDoc: true });
    const abortController = new AbortController();

    const mockWriteStream = new Writable({
      write() {
        this.emit('error', new Error('example error cannot write to file'));
      },
    });

    await expect(
      exportJSONFromQuery({
        dataService,
        ns: testNS,
        output: mockWriteStream,
        variant: 'default',
        abortSignal: abortController.signal,
      })
    ).to.be.rejectedWith(Error, 'xample error cannot write to file');
  });

  it('exports with a projection', async function () {
    const docs = ['pineapple', 'apple', 'orange', 'turtle'].map(
      (name, index) => ({
        counter: index,
        // 9007199254740992 is 2^53 (Number.MAX_SAFE_INTEGER)
        counterLong: new Long(`${`${Number.MAX_SAFE_INTEGER}` + `${index}`}`),
        name,
      })
    );
    await dataService.insertMany(testNS, docs);
    await dataService.insertOne(testNS, { testDoc: true });

    const resultPath = path.join(
      tmpdir,
      'test-export-projection.exported.ejson'
    );
    const output = fs.createWriteStream(resultPath);
    const abortController = new AbortController();

    const result = await exportJSONFromQuery({
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
          counterLong: 1,
        },
      },
      variant: 'default',
      abortSignal: abortController.signal,
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
  "counterLong": {
    "$numberLong": "90071992547409912"
  },
  "name": "orange"
},
{
  "counterLong": {
    "$numberLong": "90071992547409910"
  },
  "name": "pineapple"
}]`;
    expect(resultText).to.deep.equal(expectedText);
  });

  it('exports with relaxed json format', async function () {
    const docs = ['pineapple', 'apple', 'orange', 'turtle'].map(
      (name, index) => ({
        counter: index,
        // 9007199254740992 is 2^53 (Number.MAX_SAFE_INTEGER)
        counterLong: new Long(`${`${Number.MAX_SAFE_INTEGER}` + `${index}`}`),
        name,
      })
    );
    await dataService.insertMany(testNS, docs);
    await dataService.insertOne(testNS, { testDoc: true });

    const resultPath = path.join(
      tmpdir,
      'test-export-projection.exported.ejson'
    );
    const output = fs.createWriteStream(resultPath);
    const abortController = new AbortController();

    const result = await exportJSONFromQuery({
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
        projection: {
          _id: 0,
        },
      },
      variant: 'relaxed',
      abortSignal: abortController.signal,
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
  "counter": 1,
  "counterLong": 90071992547409900,
  "name": "apple"
},
{
  "counter": 2,
  "counterLong": 90071992547409920,
  "name": "orange"
}]`;
    expect(resultText).to.deep.equal(expectedText);
  });

  it('exports with canonical json format', async function () {
    const docs = ['pineapple', 'apple', 'orange', 'turtle'].map(
      (name, index) => ({
        counter: index,
        // 9007199254740991 is 2^53 - 1 (Number.MAX_SAFE_INTEGER)
        counterLong: new Long(`${`${Number.MAX_SAFE_INTEGER}` + `${index}`}`),
        name,
      })
    );
    await dataService.insertMany(testNS, docs);
    await dataService.insertOne(testNS, { testDoc: true });

    const resultPath = path.join(
      tmpdir,
      'test-export-projection.exported.ejson'
    );
    const output = fs.createWriteStream(resultPath);
    const abortController = new AbortController();

    const result = await exportJSONFromQuery({
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
        projection: {
          _id: 0,
        },
      },
      variant: 'canonical',
      abortSignal: abortController.signal,
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
  "counter": {
    "$numberInt": "1"
  },
  "counterLong": {
    "$numberLong": "90071992547409911"
  },
  "name": "apple"
},
{
  "counter": {
    "$numberInt": "2"
  },
  "counterLong": {
    "$numberLong": "90071992547409912"
  },
  "name": "orange"
}]`;
    expect(resultText).to.deep.equal(expectedText);
  });
});
