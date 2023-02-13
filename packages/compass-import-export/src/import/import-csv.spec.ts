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
import { analyzeCSVFields } from './analyze-csv-fields';
import { importCSV } from './import-csv';
import { formatHeaderName } from '../utils/csv';
import type { PathPart, ErrorJSON } from '../utils/csv';

const { expect } = chai;
chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('importCSV', function () {
  let dataService: DataServiceImpl;
  let dropCollection;
  let createCollection;
  let updateCollection: (ns: string, options: any) => Promise<Document>;

  beforeEach(async function () {
    dataService = new DataServiceImpl({
      connectionString: 'mongodb://localhost:27018/local',
    });

    dropCollection = promisify(dataService.dropCollection.bind(dataService));

    createCollection = promisify(
      dataService.createCollection.bind(dataService)
    );

    updateCollection = promisify(
      dataService.updateCollection.bind(dataService)
    );

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

  for (const filepath of Object.values(fixtures.csv)) {
    const basename = path.basename(filepath);

    it(`imports ${basename}`, async function () {
      const typeResult = await guessFileType({
        input: fs.createReadStream(filepath),
      });
      assert(typeResult.type === 'csv');
      const csvDelimiter = typeResult.csvDelimiter;

      const analyzeResult = await analyzeCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: csvDelimiter,
        ignoreEmptyStrings: true,
      });

      const abortController = new AbortController();
      const progressCallback = sinon.spy();

      const ns = 'db.col';

      const totalRows = analyzeResult.totalRows;
      const fields = _.mapValues(
        analyzeResult.fields,
        (field) => field.detected
      );

      const output = temp.createWriteStream();

      const stats = await importCSV({
        dataService,
        ns,
        fields,
        input: fs.createReadStream(filepath),
        output,
        delimiter: csvDelimiter,
        abortSignal: abortController.signal,
        progressCallback,
        ignoreEmptyStrings: true,
      });

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

      expect(progressCallback.callCount).to.equal(totalRows);

      const docs = await dataService.find(ns, {});

      expect(docs).to.have.length(totalRows);

      // these won't match when we compare below
      for (const doc of docs) {
        if (doc._id && doc._id._bsontype === 'ObjectId') {
          delete doc._id;
        }
      }

      const resultPath = filepath.replace(/\.csv$/, '.imported.ejson');
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
      expect(docs, basename.replace(/\.csv$/, '.imported.ejson')).to.deep.equal(
        expectedResult
      );
    });
  }

  for (const [type, filepath] of Object.entries(fixtures.csvByType)) {
    // array and object relates to the structure, not the CSVfield types
    if (['array', 'object'].includes(type)) {
      continue;
    }

    // not all types are bi-directional (yet)
    if (
      [
        'binData',
        'decimal',
        'javascript',
        'javascriptWithScope',
        'maxKey',
        'minKey',
        'objectId',
        'regex',
        'timestamp',
        'symbol',
      ].includes(type)
    ) {
      continue;
    }

    it(`correctly imports ${type} (ignoreEmptyStrings=true)`, async function () {
      const typeResult = await guessFileType({
        input: fs.createReadStream(filepath),
      });
      assert(typeResult.type === 'csv');
      const csvDelimiter = typeResult.csvDelimiter;

      const analyzeResult = await analyzeCSVFields({
        input: fs.createReadStream(filepath),
        delimiter: csvDelimiter,
        ignoreEmptyStrings: true,
      });

      const abortController = new AbortController();
      const progressCallback = sinon.spy();

      const ns = 'db.col';

      const totalRows = analyzeResult.totalRows;
      const fields = _.mapValues(
        analyzeResult.fields,
        // For the date.csv file the date field is (correctly) detected as
        // "mixed" due to the mix of an iso date string and an int64 format
        // date. In that case the user would have to explicitly select Date to
        // make it a date which is what we're testing here.
        (field) => (type === 'date' ? 'date' : field.detected)
      );

      const output = temp.createWriteStream();

      const stats = await importCSV({
        dataService,
        ns,
        fields,
        input: fs.createReadStream(filepath),
        output,
        delimiter: csvDelimiter,
        abortSignal: abortController.signal,
        progressCallback,
        ignoreEmptyStrings: true,
      });

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

      const docs = await dataService.find(ns, {}, { promoteValues: false });

      expect(docs).to.have.length(totalRows);

      for (const doc of docs) {
        for (const [key, value] of Object.entries(doc)) {
          if (key === '_id' && value._bsontype === 'ObjectId') {
            continue;
          }
          if (['something', 'something_else', 'notes'].includes(key)) {
            continue;
          }
          checkType([{ type: 'field', name: key }], value, type);
        }
      }

      expect(progressCallback.callCount).to.equal(totalRows);
    });
  }

  it('correctly imports null (ignoreEmptyStrings=false)', async function () {
    const typeResult = await guessFileType({
      input: fs.createReadStream(fixtures.csvByType.null),
    });
    assert(typeResult.type === 'csv');
    const csvDelimiter = typeResult.csvDelimiter;

    const analyzeResult = await analyzeCSVFields({
      input: fs.createReadStream(fixtures.csvByType.null),
      delimiter: csvDelimiter,
      ignoreEmptyStrings: false,
    });

    const abortController = new AbortController();
    const progressCallback = sinon.spy();

    const ns = 'db.col';

    const totalRows = analyzeResult.totalRows;
    const fields = _.mapValues(analyzeResult.fields, (field) => field.detected);

    const output = temp.createWriteStream();

    const stats = await importCSV({
      dataService,
      ns,
      fields,
      input: fs.createReadStream(fixtures.csvByType.null),
      output,
      delimiter: csvDelimiter,
      abortSignal: abortController.signal,
      progressCallback,
      ignoreEmptyStrings: false,
    });

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

    const docs = await dataService.find(ns, {}, { promoteValues: false });

    expect(docs).to.have.length(totalRows);

    for (const doc of docs) {
      delete doc._id;
    }

    expect(docs).to.deep.equal([
      {
        null: null, // interpreted as null
        notes: 'compass export writes the string Null',
      },
      {
        null: '', // interpreted as a blank string due to ignoreEmptyStrings: false
        notes: 'mongoexport writes a blank string',
      },
    ]);

    expect(progressCallback.callCount).to.equal(totalRows);
  });

  it('imports a file containing multiple batches', async function () {
    const lines = ['a,b'];
    for (let i = 0; i < 2000; i++) {
      lines.push(`${i},${i + 1}`);
    }

    const progressCallback = sinon.spy();

    const ns = 'db.col';

    const fields = {
      a: 'int',
      b: 'int',
    } as const;

    const output = temp.createWriteStream();

    const stats = await importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
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

    const docs: any[] = await dataService.find(ns, {});

    expect(docs).to.have.length(2000);

    for (const [index, doc] of docs.entries()) {
      delete doc._id;
      expect(doc).to.deep.equal({ a: index, b: index + 1 });
    }

    expect(progressCallback.callCount).to.equal(2000);
  });

  it('supports field names that are blank strings', async function () {
    const lines = ['a,,b,c.,foo..bar', '1,2,3,4,5'];

    const ns = 'db.col';

    const fields = {
      a: 'int',
      '': 'int',
      b: 'int',
      'c.': 'int',
      'foo..bar': 'int',
    } as const;

    const output = temp.createWriteStream();

    await importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
    });

    const docs: any[] = await dataService.find(ns, {});

    expect(docs).to.have.length(1);

    delete docs[0]._id;
    expect(docs[0]).to.deep.equal({
      a: 1,
      '': 2,
      b: 3,
      c: {
        '': 4,
      },
      foo: {
        '': {
          bar: 5,
        },
      },
    });
  });

  it('supports duplicate field names', async function () {
    const lines = ['a,a,b.c,b.c', '1,2,3,4'];

    const ns = 'db.col';

    const fields = {
      a: 'int',
      'b.c': 'int',
    } as const;

    const output = temp.createWriteStream();

    await importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
    });

    const docs: any[] = await dataService.find(ns, {});

    expect(docs).to.have.length(1);

    delete docs[0]._id;
    expect(docs[0]).to.deep.equal({
      a: 2,
      b: {
        c: 4,
      },
    });
  });

  it('treats top-level arrays as a blank field name', async function () {
    const lines = ['[0],[1]', '1,2'];

    const ns = 'db.col';

    const fields = {
      '': 'int',
    } as const;

    const output = temp.createWriteStream();

    await importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
    });

    const docs: any[] = await dataService.find(ns, {});

    expect(docs).to.have.length(1);

    delete docs[0]._id;
    expect(docs[0]).to.deep.equal({
      '': [1, 2],
    });
  });

  it('treats top-level objects as a blank field name', async function () {
    const lines = ['.a,.b', '1,2'];

    const ns = 'db.col';

    const fields = {
      '.a': 'int',
      '.b': 'int',
    } as const;

    const output = temp.createWriteStream();

    await importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
    });

    const docs: any[] = await dataService.find(ns, {});

    expect(docs).to.have.length(1);

    delete docs[0]._id;
    expect(docs[0]).to.deep.equal({
      '': {
        a: 1,
        b: 2,
      },
    });
  });

  it('errors when parsing the CSV header fails', async function () {
    const lines = ['a[df]', '1'];

    const ns = 'db.col';

    const fields = {
      a: 'int',
    } as const;

    const output = temp.createWriteStream();

    const promise = importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
      // notice that it doesn't matter that this is false. header not parsable is fatal regardless
      stopOnErrors: false,
    });

    await expect(promise).to.be.rejectedWith(
      Error,
      '"df" is not a number [Col 0][Row 0]'
    );
  });

  it('errors when a field is simultaneously a simple value and an object (stopOnErrors=true)', async function () {
    const lines = ['a,a.b', '1,2'];

    const ns = 'db.col';

    const fields = {
      a: 'int',
      'a.b': 'int',
    } as const;

    const output = temp.createWriteStream();

    const promise = importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
      stopOnErrors: true,
    });

    await expect(promise).to.be.rejectedWith(
      assert.AssertionError,
      'parent must be an object [Col 1][Row 1]'
    );
  });

  it('errors when a field is simultaneously a simple value and an array (stopOnErrors=true)', async function () {
    const lines = ['a,a[0]', '1,2'];

    const ns = 'db.col';

    const fields = {
      a: 'int',
    } as const;

    const output = temp.createWriteStream();

    const promise = importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
      stopOnErrors: true,
    });

    await expect(promise).to.be.rejectedWith(
      assert.AssertionError,
      'parent must be an array [Col 1][Row 1]'
    );
  });

  it('reports and writes parse errors (stopOnErrors=false)', async function () {
    const lines = [
      'a,b',
      '1,2',
      'a,3', // a is not an int
      '4,b', // b is not an int
    ];

    const ns = 'db.col';

    const fields = {
      a: 'int',
      b: 'int',
    } as const;

    const output = temp.createWriteStream();
    const progressCallback = sinon.spy();
    const errorCallback = sinon.spy();

    const stats = await importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
      stopOnErrors: false,
      progressCallback,
      errorCallback,
    });

    expect(stats.nInserted).to.equal(1);

    expect(progressCallback.callCount).to.equal(3);
    expect(errorCallback.callCount).to.equal(2);

    const expectedErrors = [
      {
        name: 'Error',
        message: '"a" is not a number [Col 0][Row 2]',
      },
      {
        name: 'Error',
        message: '"b" is not a number [Col 1][Row 3]',
      },
    ];

    const errors = errorCallback.args.map((args) => args[0]);

    expect(errors).to.deep.equal(expectedErrors);

    const errorsText = await fs.promises.readFile(output.path, 'utf8');
    expect(errorsText).to.equal(formatErrorLines(expectedErrors));
  });

  it('reports and writes database errors (stopOnErrors=false)', async function () {
    const lines = ['a,b', '1,2', '3,4', '5,6'];

    const ns = 'db.col';

    const fields = {
      a: 'int',
      b: 'int',
    } as const;

    const output = temp.createWriteStream();
    const progressCallback = sinon.spy();
    const errorCallback = sinon.spy();

    await updateCollection(ns, {
      validator: {
        $jsonSchema: {
          required: ['xxx'],
        },
      },
    });

    const stats = await importCSV({
      dataService,
      ns,
      fields,
      input: Readable.from(lines.join('\n')),
      output,
      stopOnErrors: false,
      progressCallback,
      errorCallback,
    });

    expect(stats.nInserted).to.equal(0);

    expect(progressCallback.callCount).to.equal(3);
    expect(errorCallback.callCount).to.equal(4); // yes one more MongoBulkWriteError than items in the batch

    const expectedErrors = [
      {
        // first one speems to relate to the batch as there's no index
        name: 'MongoBulkWriteError',
        message: 'Document failed validation',
        code: 121,
      },
      {
        name: 'WriteConcernError',
        message: 'Document failed validation',
        index: 0,
        code: 121,
      },
      {
        name: 'WriteConcernError',
        message: 'Document failed validation',
        index: 1,
        code: 121,
      },
      {
        name: 'WriteConcernError',
        message: 'Document failed validation',
        index: 2,
        code: 121,
      },
    ];

    const errors = errorCallback.args.map((args) => args[0]);

    expect(errors).to.deep.equal(expectedErrors);

    const errorsText = await fs.promises.readFile(output.path, 'utf8');
    expect(errorsText).to.equal(formatErrorLines(expectedErrors));
  });

  it('responds to abortSignal.aborted', async function () {
    const abortController = new AbortController();

    abortController.abort();

    const ns = 'db.col';
    const fields = {};

    const output = temp.createWriteStream();

    const stats = await importCSV({
      dataService,
      ns,
      fields,
      input: fs.createReadStream(fixtures.csv.complex),
      output,
      abortSignal: abortController.signal,
    });

    // only looked at the first row because we aborted before even starting
    expect(stats).to.deep.equal({
      aborted: true,
      nInserted: 0,
      nMatched: 0,
      nModified: 0,
      nRemoved: 0,
      nUpserted: 0,
      ok: 0,
      writeConcernErrors: [],
      writeErrors: [],
    });
  });
});

function checkType(path: PathPart[], value: any, type: string) {
  if (Array.isArray(value)) {
    for (const [index, child] of value.entries()) {
      checkType([...path, { type: 'index', index }], child, type);
    }
    return;
  }

  if (_.isObject(value) && !(value as any)._bsontype) {
    for (const [name, child] of Object.entries(value)) {
      checkType([...path, { type: 'field', name }], child, type);
    }
    return;
  }

  const joinedPath = formatHeaderName(path);

  switch (type) {
    case 'boolean':
      expect(typeof value, joinedPath).to.equal('boolean');
      break;

    case 'string':
      expect(typeof value, joinedPath).to.equal('string');
      break;

    case 'date':
      expect(Object.prototype.toString.call(value), joinedPath).to.equal(
        '[object Date]'
      );
      break;

    case 'double':
      expect(value._bsontype, joinedPath).to.equal('Double');
      break;

    case 'int':
      expect(value._bsontype, joinedPath).to.equal('Int32');
      break;

    case 'long':
      expect(value._bsontype, joinedPath).to.equal('Long');
      break;

    case 'null':
      expect(value, joinedPath).to.equal(null);
      break;

    case 'number': // useful for the mixed numbers test
      expect(['Double', 'Int32', 'Long'], joinedPath).to.include(
        value._bsontype
      );
      break;

    case 'mixed': // useful for the mixed test
      // at least check that every value in the file has a known type
      if (value === null) {
        expect(value, joinedPath).to.equal(value);
      } else if (Object.prototype.toString.call(value) === '[object Date]') {
        expect(Object.prototype.toString.call(value), joinedPath).to.equal(
          '[object Date]'
        );
      } else if (value._bsontype) {
        expect(['Double', 'Int32', 'Long'], joinedPath).to.include(
          value._bsontype
        );
      } else {
        expect(['boolean', 'string']).to.include(typeof value);
      }
      break;

    default:
      console.log(
        joinedPath,
        value,
        typeof value,
        value._bsontype,
        Object.keys(value)
      );
      throw new Error(`No check for ${type} at ${joinedPath}.`);
  }
}

function formatErrorLines(errors: ErrorJSON[]) {
  return errors.map((err) => JSON.stringify(err)).join(os.EOL) + os.EOL;
}
