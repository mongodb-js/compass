import { Writable } from 'stream';
import { CursorExporter } from './CursorExporter';
import { expect } from 'chai';
import { spy } from 'sinon';
import { MongoClient } from 'mongodb';

class StringStream extends Writable {
  public output = '';
  constructor() {
    super();
  }
  _write(chunk, enc, next) {
    this.output += chunk.toString();
    next();
  }
  getOutput() {
    return this.output;
  }
}

describe('CursorExporter', function () {
  this.timeout(5000);
  let cursor;
  let client: MongoClient;
  let testCollectionName: string;
  let collection;
  let outputStream: StringStream;
  afterEach(async function () {
    await collection.drop();
    await client.close();
  });

  beforeEach(async function () {
    testCollectionName = 'cursor-exporter-test-' + Date.now().toString();
    client = new MongoClient('mongodb://localhost:27018/test');
    collection = client.db().collection(testCollectionName);
    outputStream = new StringStream();
    await client.connect();
    await collection.insertMany([
      {
        _id: 'foo',
        first_name: 'John',
        last_name: 'Appleseed',
      },
    ]);
    cursor = collection.find();
  });
  describe('Formatters', function () {
    describe('CSV', function () {
      it('should export all documents', async function () {
        const exporter = new CursorExporter(cursor, 'csv', outputStream);
        await exporter.start();
        expect(outputStream.getOutput()).to.be.equal(
          '_id,first_name,last_name\nfoo,John,Appleseed'
        );
      });
    });

    describe('JSON', function () {
      it('should export all documents', async function () {
        const exporter = new CursorExporter(cursor, 'json', outputStream);
        await exporter.start();
        expect(JSON.parse(outputStream.getOutput())).to.be.deep.equal([
          {
            _id: 'foo',
            first_name: 'John',
            last_name: 'Appleseed',
          },
        ]);
      });
    });
  });

  describe('Events', function () {
    it('should emit "progress" event for each document', async function () {
      const data = [
        { first_name: 'Alice', _id: 'qwerty' },
        { first_name: 'Bob', _id: 'asdfg' },
        { first_name: 'Charlie', _id: 'zxcvb' },
        { first_name: 'Diana', _id: '12345' },
      ];
      await collection.insertMany(data);
      const onProgress = spy();
      const exporter = new CursorExporter(
        collection.find(),
        'csv',
        outputStream
      );
      exporter.on('progress', onProgress);
      await exporter.start();
      expect(onProgress.callCount).to.equal(5);
    });
  });

  it('should support aggregation results', async function () {});
  it('should pause export', function () {});
});
