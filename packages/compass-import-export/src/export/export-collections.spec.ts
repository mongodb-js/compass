import os from 'os';
import fs from 'fs';
import path from 'path';
import { EJSON } from 'bson';
import { expect } from 'chai';
import { connect } from 'mongodb-data-service';
import type { DataService } from 'mongodb-data-service';
import { mochaTestServer } from '@mongodb-js/compass-test-server';

import {
  collectionNameToFileName,
  exportCollectionsToDirectory,
  getCollectionMetadata,
} from './export-collections';

const testDB = 'export-collections-test';

describe('exportCollectionsToDirectory', function () {
  const cluster = mochaTestServer();
  let dataService: DataService;
  let tmpdir: string;

  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      'compass-export-collections-test',
      `test-${Date.now()}`
    );

    dataService = await connect({
      connectionOptions: {
        connectionString: cluster().connectionString,
      },
    });

    try {
      await dataService.dropDatabase(testDB);
    } catch {
      // ignore
    }

    await dataService.createCollection(`${testDB}.customers`, {
      validator: { $jsonSchema: { required: ['email'] } },
    });
    await dataService.insertMany(`${testDB}.customers`, [
      { email: 'a@example.com' },
      { email: 'b@example.com' },
    ]);
    await dataService.createIndex(
      `${testDB}.customers`,
      { email: 1 },
      { unique: true }
    );
    await dataService.insertMany(`${testDB}.orders`, [
      { orderNo: 1 },
      { orderNo: 2 },
      { orderNo: 3 },
    ]);
  });

  afterEach(async function () {
    await fs.promises.rm(tmpdir, { recursive: true, force: true });
    await dataService.disconnect();
  });

  it('writes one JSON file per collection', async function () {
    const result = await exportCollectionsToDirectory({
      databaseName: testDB,
      collectionNames: ['customers', 'orders'],
      directoryPath: tmpdir,
      dataService,
      fileType: 'json',
      variant: 'canonical',
      includeMetadata: false,
    });

    expect(result.aborted).to.equal(false);
    expect(
      result.collections.map(({ collectionName, docsWritten }) => ({
        collectionName,
        docsWritten,
      }))
    ).to.deep.equal([
      { collectionName: 'customers', docsWritten: 2 },
      { collectionName: 'orders', docsWritten: 3 },
    ]);

    const files = await fs.promises.readdir(tmpdir);
    expect(files.sort()).to.deep.equal(['customers.json', 'orders.json']);

    const orders = EJSON.parse(
      await fs.promises.readFile(path.join(tmpdir, 'orders.json'), 'utf8')
    );
    expect(orders.map((doc: any) => doc.orderNo)).to.deep.equal([1, 2, 3]);
  });

  it('writes one CSV file per collection with every field', async function () {
    const result = await exportCollectionsToDirectory({
      databaseName: testDB,
      collectionNames: ['customers', 'orders'],
      directoryPath: tmpdir,
      dataService,
      fileType: 'csv',
      variant: 'default',
      includeMetadata: true,
    });

    expect(result.collections.map((c) => c.docsWritten)).to.deep.equal([2, 3]);

    const files = await fs.promises.readdir(tmpdir);
    expect(files.sort()).to.deep.equal([
      'customers.csv',
      'customers.metadata.json',
      'orders.csv',
      'orders.metadata.json',
    ]);

    const [header, ...rows] = (
      await fs.promises.readFile(path.join(tmpdir, 'orders.csv'), 'utf8')
    )
      .trim()
      .split(/\r?\n/);
    expect(header).to.equal('_id,orderNo');
    expect(rows.map((row) => row.split(',')[1])).to.deep.equal(['1', '2', '3']);
  });

  it('writes metadata files with options and indexes', async function () {
    await exportCollectionsToDirectory({
      databaseName: testDB,
      collectionNames: ['customers'],
      directoryPath: tmpdir,
      dataService,
      fileType: 'json',
      variant: 'default',
      includeMetadata: true,
    });

    const metadata = EJSON.parse(
      await fs.promises.readFile(
        path.join(tmpdir, 'customers.metadata.json'),
        'utf8'
      )
    );
    expect(metadata.collectionName).to.equal('customers');
    expect(metadata.options.validator).to.deep.equal({
      $jsonSchema: { required: ['email'] },
    });
    const emailIndex = metadata.indexes.find(
      (index: any) => index.name === 'email_1'
    );
    expect(emailIndex.key).to.deep.equal({ email: 1 });
    expect(emailIndex.unique).to.equal(true);
  });

  it('reports a failing collection and continues with the rest', async function () {
    const failingDataService = {
      ...dataService,
      collectionInfo: dataService.collectionInfo.bind(dataService),
      indexes: dataService.indexes.bind(dataService),
      findCursor: (ns: string, ...args: any[]) => {
        if (ns.endsWith('.customers')) {
          throw new Error('cursor failed');
        }
        return (dataService.findCursor as any)(ns, ...args);
      },
    };

    const result = await exportCollectionsToDirectory({
      databaseName: testDB,
      collectionNames: ['customers', 'orders'],
      directoryPath: tmpdir,
      dataService: failingDataService as any,
      fileType: 'json',
      variant: 'default',
      includeMetadata: false,
    });

    expect(result.collections[0].error?.message).to.equal('cursor failed');
    expect(result.collections[1].error).to.equal(undefined);
    expect(result.collections[1].docsWritten).to.equal(3);
  });

  it('stops before the next collection when aborted', async function () {
    const abortController = new AbortController();

    const result = await exportCollectionsToDirectory({
      databaseName: testDB,
      collectionNames: ['customers', 'orders'],
      directoryPath: tmpdir,
      dataService,
      fileType: 'json',
      variant: 'default',
      includeMetadata: false,
      abortSignal: abortController.signal,
      onCollectionStart: (collectionName) => {
        if (collectionName === 'customers') {
          abortController.abort();
        }
      },
    });

    expect(result.aborted).to.equal(true);
    expect(result.collections.map((c) => c.collectionName)).to.deep.equal([
      'customers',
    ]);
    expect(result.collections[0].aborted).to.equal(true);
  });

  it('builds metadata through the data service', async function () {
    const metadata = await getCollectionMetadata({
      databaseName: testDB,
      collectionName: 'orders',
      dataService,
    });
    expect(metadata.options).to.deep.equal({});
    expect(metadata.indexes.map((index: any) => index.name)).to.deep.equal([
      '_id_',
    ]);
  });
});

describe('collectionNameToFileName', function () {
  it('keeps regular names as they are', function () {
    expect(collectionNameToFileName('orders.2026')).to.equal('orders.2026');
  });

  it('percent-encodes characters that are not valid in file names', function () {
    expect(collectionNameToFileName('a:b/c?d%e')).to.equal('a%3Ab%2Fc%3Fd%25e');
  });
});
