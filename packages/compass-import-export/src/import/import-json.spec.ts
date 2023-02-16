import os from 'os';
import _ from 'lodash';
import assert from 'assert';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Readable } from 'stream';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import temp from 'temp';

temp.track();

import { DataServiceImpl } from 'mongodb-data-service';

import { fixtures } from '../../test/fixtures';

import { guessFileType } from './guess-filetype';
import { importJSON } from './import-json';
//import type { ErrorJSON } from '../utils/import'

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe.only('importJSON', function () {
  let dataService: DataServiceImpl;
  let dropCollection;
  let createCollection;
  //let updateCollection: (ns: string, options: any) => Promise<Document>;

  beforeEach(async function () {
    dataService = new DataServiceImpl({
      connectionString: 'mongodb://localhost:27018/local',
    });

    dropCollection = promisify(dataService.dropCollection.bind(dataService));

    createCollection = promisify(
      dataService.createCollection.bind(dataService)
    );

    /*
    updateCollection = promisify(
      dataService.updateCollection.bind(dataService)
    );
    */

    await dataService.connect();

    try {
      await dropCollection('db.col');
    } catch (err) {
      // ignore
    }
    await createCollection('db.col', {});
  });

  afterEach(async function () {
    await dataService.disconnect();
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

        const output = temp.createWriteStream();

        const stats = await importJSON({
          dataService,
          ns,
          input: fs.createReadStream(filepath),
          output,
          abortSignal: abortController.signal,
          progressCallback,
          jsonVariant: fixtureType,
        });

        expect(progressCallback.callCount).to.be.gt(0);

        const totalRows = progressCallback.callCount;

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

        const docs = await dataService.find(ns, {});

        expect(docs).to.have.length(totalRows);

        // these won't match when we compare below
        for (const doc of docs) {
          if (doc._id && doc._id._bsontype === 'ObjectId') {
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

        const expectedResult = EJSON.parse(text);
        expect(
          docs,
          basename.replace(/\.((jsonl?)|(csv))$/, '.imported.ejson')
        ).to.deep.equal(expectedResult);
      });
    }
  }

  it('imports a file containing multiple batches');
  it('reports and writes parse errors (stopOnErrors=false)');
  it('reports and writes database errors (stopOnErrors=false)');
  it('responds to abortSignal.aborted');
});
