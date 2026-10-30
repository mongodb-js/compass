/* eslint-disable no-console */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { BSONError, EJSON } from 'bson';
import { MongoBulkWriteError } from 'mongodb';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { omit } from 'lodash';

import type { DataService } from 'mongodb-data-service';
import { connect } from 'mongodb-data-service';

import { mochaTestServer } from '@mongodb-js/compass-test-server';
import { getBsonType } from 'hadron-type-checker';
import { fixtures } from '../../test/fixtures';

import type { ErrorJSON } from './import-types';

import { guessFileType } from './guess-filetype';
import { importJSON } from './import-json';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('importJSON', function () {
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
    } catch {
      // ignore
    }
    await dataService.createCollection('db.col', {});
  });

  afterEach(async function () {
    try {
      await dataService.disconnect();
    } catch {
      // ignore
    }
  });

  for (const fixtureType of ['json', 'jsonl'] as const) {
    for (const filepath of Object.values(fixtures[fixtureType])) {
      const basename = path.basename(filepath);

      it(`imports ${basename}`, async function () {
        const typeResult = await guessFileType({
          input: fs.createReadStream(filepath),
        });
        assert(typeResult.type === fixtureType);

        const abortController = new AbortController();
        const progressCallback = sinon.spy();

        const ns = 'db.col';

        const result = await importJSON({
          dataService,
          ns,
          input: fs.createReadStream(filepath),
          abortSignal: abortController.signal,
          progressCallback,
          jsonVariant: fixtureType,
        });

        expect(progressCallback.callCount).to.be.gt(0);

        const totalRows = progressCallback.callCount;

        const firstCallArg = Object.assign(
          {},
          progressCallback.firstCall.args[0]
        );
        expect(firstCallArg.bytesProcessed).to.be.gt(0);
        delete firstCallArg.bytesProcessed;

        expect(firstCallArg).to.deep.equal({
          docsProcessed: 1,
          docsWritten: 0,
        });

        const fileStat = await fs.promises.stat(filepath);

        const lastCallArg = Object.assign(
          {},
          progressCallback.lastCall.args[0]
        );

        // bit of a race condition. could be 0, could be totalRows..
        delete lastCallArg.docsWritten;

        expect(lastCallArg).to.deep.equal({
          bytesProcessed: fileStat.size,
          docsProcessed: totalRows,
        });

        expect(omit(result, 'biggestDocSize')).to.deep.equal({
          docsErrored: 0,
          docsWritten: totalRows,
          docsProcessed: totalRows,
          hasUnboundArray: false,
        });

        const docs = await dataService.find(ns, {}, { promoteValues: false });

        expect(docs).to.have.length(totalRows);

        // these won't match when we compare below
        for (const doc of docs) {
          if (doc._id && getBsonType(doc._id) === 'ObjectId') {
            delete doc._id;
          }
        }

        const resultPath = filepath.replace(
          /\.((jsonl?)|(csv))$/,
          '.imported.ejson'
        );
        let text;
        try {
          text = await fs.promises.readFile(resultPath, 'utf8');
        } catch (err) {
          // This helps to tell you which file is missing and what the expected
          // content is which helps when adding a new .csv fixture
          console.log(resultPath);
          console.log(EJSON.stringify(docs, undefined, 2, { relaxed: false }));
          throw err;
        }

        const expectedResult = EJSON.parse(text, { relaxed: false });
        expect(
          docs,
          basename.replace(/\.((jsonl?)|(csv))$/, '.imported.ejson')
        ).to.deep.equal(expectedResult);
      });
    }
  }

  it('imports a file with a document field', async function () {
    const lines: string[] = [JSON.stringify({ document: 1 })];

    const progressCallback = sinon.spy();

    const ns = 'db.col';

    const result = await importJSON({
      dataService,
      ns,
      input: Readable.from(lines.join('\n')),
      progressCallback,
      jsonVariant: 'jsonl',
    });

    expect(omit(result, 'biggestDocSize')).to.deep.equal({
      docsErrored: 0,
      docsProcessed: 1,
      docsWritten: 1,
      hasUnboundArray: false,
    });

    const docs: any[] = await dataService.find(ns, {});

    expect(docs).to.have.length(1);

    for (const doc of docs) {
      delete doc._id;
      expect(doc).to.deep.equal({ document: 1 });
    }

    expect(progressCallback.callCount).to.equal(1);
  });

  it('imports a file containing multiple batches', async function () {
    const lines: string[] = [];
    for (let i = 0; i < 2000; i++) {
      lines.push(JSON.stringify({ i }));
    }

    const progressCallback = sinon.spy();

    const ns = 'db.col';

    const result = await importJSON({
      dataService,
      ns,
      input: Readable.from(lines.join('\n')),
      progressCallback,
      jsonVariant: 'jsonl',
    });

    expect(omit(result, 'biggestDocSize')).to.deep.equal({
      docsErrored: 0,
      docsProcessed: 2000,
      docsWritten: 2000,
      hasUnboundArray: false,
    });

    const docs: any[] = await dataService.find(ns, {});

    expect(docs).to.have.length(2000);

    for (const [i, doc] of docs.entries()) {
      delete doc._id;
      expect(doc).to.deep.equal({ i });
    }

    expect(progressCallback.callCount).to.equal(2000);
  });

  it('errors if a json file does not parse', async function () {
    const ns = 'db.col';

    const promise = importJSON({
      dataService,
      ns,
      input: Readable.from('x'),
      // should fail regardless of stopOnErrors because the whole file doesn't parse
      stopOnErrors: false,
      jsonVariant: 'json',
    });

    await expect(promise).to.be.rejectedWith(
      Error,
      'Parser cannot parse input: expected a value'
    );
  });

  it('errors if a jsonl file does not parse', async function () {
    const ns = 'db.col';

    const promise = importJSON({
      dataService,
      ns,
      input: Readable.from('x'),
      // should fail regardless of stopOnErrors because the whole file doesn't parse
      stopOnErrors: false,
      jsonVariant: 'jsonl',
    });

    await expect(promise).to.be.rejectedWith(
      Error,
      'Parser cannot parse input: expected a value'
    );
  });

  it('errors if a json file is passed as jsonl', async function () {
    const ns = 'db.col';

    const promise = importJSON({
      dataService,
      ns,
      input: Readable.from('[{"a": 1}]'),
      stopOnErrors: true,
      jsonVariant: 'jsonl',
    });

    await expect(promise).to.be.rejectedWith(
      Error,
      'Value is not an object [Index 0]'
    );
  });

  it('errors if a jsonl file is passed as json', async function () {
    const ns = 'db.col';

    const promise = importJSON({
      dataService,
      ns,
      input: Readable.from('{"a": 1}'),
      // should fail regardless of stopOnErrors because the whole file doesn't parse
      stopOnErrors: false,
      jsonVariant: 'json',
    });

    await expect(promise).to.be.rejectedWith(
      Error,
      'Top-level object should be an array'
    );
  });

  it('errors if a json file contains things that are not arrays', async function () {
    const ns = 'db.col';

    const promise = importJSON({
      dataService,
      ns,
      input: Readable.from('5'),
      // should fail regardless of stopOnErrors because the whole file doesn't parse
      stopOnErrors: false,
      jsonVariant: 'json',
    });

    await expect(promise).to.be.rejectedWith(
      Error,
      'Top-level object should be an array'
    );
  });

  it('errors if a jsonl file contains things that are not objects', async function () {
    const ns = 'db.col';

    const promise = importJSON({
      dataService,
      ns,
      input: Readable.from('{ "a": 1}\n5'),
      stopOnErrors: true,
      jsonVariant: 'jsonl',
    });

    await expect(promise).to.be.rejectedWith(
      Error,
      'Value is not an object [Index 1]' // only the second one failed. First one passed.
    );
  });

  it('errors if there are parse errors (stopOnErrors=true', async function () {
    const lines: string[] = [];

    lines.push(
      JSON.stringify({
        date: {
          $date: {
            $numberLong: '', // broken extended json
          },
        },
      })
    );

    lines.push(
      JSON.stringify({
        date: {
          $date: {
            $numberLong: '974395800000',
          },
        },
      })
    );

    const ns = 'db.col';

    const promise = importJSON({
      dataService,
      ns,
      input: Readable.from(lines.join('\n')),
      stopOnErrors: true,
      jsonVariant: 'jsonl',
    });

    await expect(promise).to.be.rejectedWith(
      BSONError,
      '$numberLong string "" is in an invalid format [Index 0]'
    );
  });

  it('report parse errors (stopOnErrors=false)', async function () {
    const lines: string[] = [];

    lines.push(
      JSON.stringify({
        date: {
          $date: {
            $numberLong: '', // broken extended json
          },
        },
      })
    );

    lines.push(
      JSON.stringify({
        date: {
          $date: {
            $numberLong: '974395800000',
          },
        },
      })
    );

    const ns = 'db.col';

    const progressCallback = sinon.spy();
    const errorCallback = sinon.spy();

    const result = await importJSON({
      dataService,
      ns,
      input: Readable.from(lines.join('\n')),
      stopOnErrors: false,
      jsonVariant: 'jsonl',
      progressCallback,
      errorCallback,
    });

    expect(omit(result, 'biggestDocSize')).to.deep.equal({
      docsErrored: 1,
      docsProcessed: 2,
      docsWritten: 1,
      hasUnboundArray: false,
    });

    expect(progressCallback.callCount).to.equal(2);
    expect(errorCallback.callCount).to.equal(1);

    const expectedErrors = [
      {
        name: 'BSONError',
        message: '$numberLong string "" is in an invalid format [Index 0]',
      },
    ];

    const errors = errorCallback.args.map((args) => args[0]);

    expect(errors).to.deep.equal(expectedErrors);
  });

  it('errors if there are database errors (stopOnErrors=true)', async function () {
    const lines = [{ i: 0 }, { i: 1 }].map((doc) => JSON.stringify(doc));

    const ns = 'db.col';

    const progressCallback = sinon.spy();
    const errorCallback = sinon.spy();

    await dataService.updateCollection(ns, {
      validator: {
        $jsonSchema: {
          required: ['xxx'],
        },
      },
    });

    const promise = importJSON({
      dataService,
      ns,
      input: Readable.from(lines.join('\n')),
      stopOnErrors: true,
      jsonVariant: 'jsonl',
      progressCallback,
      errorCallback,
    });

    await expect(promise).to.be.rejectedWith(
      MongoBulkWriteError,
      'Document failed validation'
    );
  });

  it('report database errors (stopOnErrors=false)', async function () {
    const lines = [{ i: 0 }, { i: 1 }].map((doc) => JSON.stringify(doc));

    const ns = 'db.col';

    const progressCallback = sinon.spy();
    const errorCallback = sinon.spy();

    await dataService.updateCollection(ns, {
      validator: {
        $jsonSchema: {
          required: ['xxx'],
        },
      },
    });

    const result = await importJSON({
      dataService,
      ns,
      input: Readable.from(lines.join('\n')),
      stopOnErrors: false,
      jsonVariant: 'jsonl',
      progressCallback,
      errorCallback,
    });

    expect(omit(result, 'biggestDocSize')).to.deep.equal({
      docsErrored: 2,
      docsProcessed: 2,
      docsWritten: 0,
      hasUnboundArray: false,
    });

    expect(progressCallback.callCount).to.equal(2);
    expect(errorCallback.callCount).to.equal(2);

    const expectedErrors: ErrorJSON[] = [
      {
        name: 'WriteError',
        message: 'Document failed validation',
        index: 0,
        code: 121,
      },
      {
        name: 'WriteError',
        message: 'Document failed validation',
        index: 1,
        code: 121,
      },
    ];

    const errors = errorCallback.args.map((args) => args[0]);
    for (const [index, error] of errors.entries()) {
      expect(error.op).to.exist;
      expect(error).to.deep.contain(expectedErrors[index]);
      expect(error).to.have.nested.property('errInfo.details');
    }
  });

  it('responds to abortSignal.aborted', async function () {
    const abortController = new AbortController();

    abortController.abort();

    const ns = 'db.col';

    const result = await importJSON({
      dataService,
      ns,
      input: fs.createReadStream(fixtures.csv.complex),
      abortSignal: abortController.signal,
      jsonVariant: 'jsonl',
    });

    // only looked at the first row because we aborted before even starting
    expect(omit(result, 'biggestDocSize')).to.deep.equal({
      aborted: true,
      docsErrored: 0,
      docsProcessed: 0,
      docsWritten: 0,
      hasUnboundArray: false,
    });
  });

  it('does not mind windows style line breaks', async function () {
    const text = await fs.promises.readFile(fixtures.json.good, 'utf8');
    const replaced = text.replace(/\n/g, '\r\n');
    const input = Readable.from(replaced);

    const ns = 'db.col';

    await importJSON({
      dataService,
      ns,
      input,
      jsonVariant: 'json',
    });

    const docs = await dataService.find(
      ns,
      {},
      { promoteValues: false, bsonRegExp: true }
    );

    expect(docs).to.have.length(3);

    for (const doc of docs) {
      expect(Object.keys(doc)).to.deep.equal(['_id', 'uuid', 'name']);
    }
  });

  it('errors if a file is not valid utf8', async function () {
    const testDocs = [
      {
        ê: 1,
        foo: 2,
      },
    ];
    const latin1Buffer = Buffer.from(JSON.stringify(testDocs), 'latin1');
    const input = Readable.from(latin1Buffer);

    const ns = 'db.col';

    await expect(
      importJSON({
        dataService,
        ns,
        input,
        jsonVariant: 'json',
      })
    ).to.be.rejectedWith(TypeError, /The encoded data was not valid/);
  });

  it('strips the BOM character', async function () {
    const text = await fs.promises.readFile(fixtures.json.good, 'utf8');
    const input = Readable.from('\uFEFF' + text);

    const ns = 'db.col';

    await importJSON({
      dataService,
      ns,
      input,
      jsonVariant: 'json',
    });

    const docs = await dataService.find(
      ns,
      {},
      { promoteValues: false, bsonRegExp: true }
    );

    expect(docs).to.have.length(3);

    for (const doc of docs) {
      expect(Object.keys(doc)).to.deep.equal(['_id', 'uuid', 'name']);
    }
  });
});
