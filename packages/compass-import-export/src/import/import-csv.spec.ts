import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { DataServiceImpl } from 'mongodb-data-service';

import { guessFileType } from './guess-filetype';
import { importCSV } from './import-csv';
import { fixtures } from '../../test/fixtures';

const { expect } = chai;
chai.use(sinonChai);

describe.only('importCSV', function () {
  const dataService = new DataServiceImpl({
    connectionString: 'mongodb://localhost:27018/local',
  });

  const dropCollection = promisify(dataService.dropCollection.bind(
    dataService
  ));

  const createCollection = promisify(dataService.createCollection.bind(
    dataService
  ));

  beforeEach(async function () {
    await dataService.connect();
    try {
      await dropCollection('db.col');
    }
    catch (err) {
      // ignore
    }
    await createCollection('db.col');
  });

  afterEach(async function () {
    await dataService.disconnect();
  });

  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);

    it(`imports ${basename}`, async function () {
      const typeResult = await guessFileType({
        input: fs.createReadStream(filepath),
      });
      assert(typeResult.type === 'csv');
      const csvDelimiter = typeResult.csvDelimiter;

      const abortController = new AbortController();
      const progressCallback = sinon.spy();

      const ns = 'db.col';
      const fields = {};

      const stats = await importCSV({
        dataService,
        ns,
        fields,
        input: fs.createReadStream(filepath),
        delimiter: csvDelimiter,
        abortSignal: abortController.signal,
        progressCallback,
      });

      const totalRows = 0; // TODO: get this from analyzeCSVFields()


      expect(stats).to.deep.equal({
        nInserted: totalRows,
        nMatched: 0,
        nModified: 0,
        nRemoved: 0,
        nUpserted: 0,
        ok: Math.ceil(totalRows / 1000),
        writeConcernErrors: [],
        writeErrors: [],
      });
    });

    it('imports a file containing multiple batches', async function () {
      const lines = ['a,b'];
      for (let i=0; i<2000; i++) {
        lines.push(`${i},${i+1}`);
      }

      const abortController = new AbortController();
      const progressCallback = sinon.spy();

      const ns = 'db.col';

      const fields = {
        a: 'int',
        b: 'int'
      } as const;

      const stats = await importCSV({
        dataService,
        ns,
        fields,
        input: Readable.from(lines.join('\n')),
        delimiter: ',',
        abortSignal: abortController.signal,
        progressCallback,
      });

      expect(stats).to.deep.equal({
        nInserted: 2000,
        nMatched: 0,
        nModified: 0,
        nRemoved: 0,
        nUpserted: 0,
        ok: 2, // expected two batches
        writeConcernErrors: [],
        writeErrors: [],
      });
    });
  }

  it.skip('responds to abortSignal.aborted', async function () {
    const abortController = new AbortController();
    const progressCallback = sinon.spy();

    abortController.abort();

    const ns = 'db.col';
    const fields = {};

    const stats = await importCSV({
      dataService,
      ns,
      fields,
      input: fs.createReadStream(fixtures.csv.complex),
      delimiter: ',',
      abortSignal: abortController.signal,
      progressCallback,
    });

    expect(stats).to.equal({});

    // TODO: how should abort even work? shouldn't it throw? Or should it work like any other error?
    // only looked at the first row because we aborted before even starting
    //expect(result).to.have.length(1);
    //expect(result[0].message).to.equal('aborted');
  });
});
