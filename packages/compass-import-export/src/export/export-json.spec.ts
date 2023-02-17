// import os from 'os';
// import assert from 'assert';
// import { EJSON } from 'bson';
// import type { Document } from 'bson';
// import fs from 'fs';
// import path from 'path';
import { promisify } from 'util';
// import { Readable } from 'stream';
import chai from 'chai';
// import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import temp from 'temp';

temp.track();

import { DataServiceImpl } from 'mongodb-data-service';

// import { fixtures } from '../../test/fixtures';

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

  // Insert documents once for all of the tests.
  before(async function () {
    dataService = new DataServiceImpl({
      connectionString: 'mongodb://localhost:27018/local',
    });

    dropCollection = promisify(dataService.dropCollection.bind(dataService));

    createCollection = promisify(
      dataService.createCollection.bind(dataService)
    );

    insertOne = promisify(dataService.insertOne.bind(dataService));

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

  after(async function () {
    await dataService.disconnect();
  });

  it('exports', async function () {
    const fileName = 'test.json';

    const ns = testNS;
    const abortController = new AbortController();

    const result = await exportJSON({
      dataService,
      ns,
      fields: [],
      // input: collection,// TODO: collection stream instead of passing query/agg?
      // aggregation: false,
      output: temp.createWriteStream(),
      variant: 'default',
      abortSignal: abortController.signal,
      progressCallback: () => {},
    });

    expect(result.docsWritten).to.equal(1);
    expect(result.aborted).to.be.false;

    console.log('export json result', result);
  });

  it('responds to abortSignal.aborted', async function () {
    const fileName = 'aborted-signal-test-output.json';

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
