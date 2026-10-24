import os from 'os';
import fs from 'fs';
import path from 'path';
import { EJSON } from 'bson';
import type { Document } from 'bson';
import { expect } from 'chai';
import { connect } from 'mongodb-data-service';
import type { DataService } from 'mongodb-data-service';
import { mochaTestServer } from '@mongodb-js/compass-test-server';

import {
  assignFileNames,
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
    expect(orders.map((doc: Document) => doc.orderNo)).to.deep.equal([1, 2, 3]);
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
      (index: Document) => index.name === 'email_1'
    );
    expect(emailIndex.key).to.deep.equal({ email: 1 });
    expect(emailIndex.unique).to.equal(true);
  });

  it('reports a failing collection and continues with the rest', async function () {
    const failingDataService: Parameters<
      typeof exportCollectionsToDirectory
    >[0]['dataService'] = {
      collectionInfo: dataService.collectionInfo.bind(dataService),
      indexes: dataService.indexes.bind(dataService),
      findCursor: (ns, filter, options) => {
        if (ns.endsWith('.customers')) {
          throw new Error('cursor failed');
        }
        return dataService.findCursor(ns, filter, options);
      },
    };

    const result = await exportCollectionsToDirectory({
      databaseName: testDB,
      collectionNames: ['customers', 'orders'],
      directoryPath: tmpdir,
      dataService: failingDataService,
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
    expect(metadata.indexes.map((index: Document) => index.name)).to.deep.equal(
      ['_id_']
    );
  });
});

describe('collectionNameToFileName', function () {
  it('keeps regular names as they are', function () {
    expect(collectionNameToFileName('orders.2026')).to.equal('orders.2026');
  });

  it('percent-encodes characters that are not valid in file names', function () {
    expect(collectionNameToFileName('a:b/c?d%e')).to.equal('a%3Ab%2Fc%3Fd%25e');
  });

  it('avoids names that Windows reserves or rejects', function () {
    expect(collectionNameToFileName('con')).to.equal('%63on');
    expect(collectionNameToFileName('NUL.backup')).to.equal('%4EUL.backup');
    expect(collectionNameToFileName('console')).to.equal('console');
    expect(collectionNameToFileName('logs.')).to.equal('logs%2E');
    expect(collectionNameToFileName('logs ')).to.equal('logs%20');
  });

  it('never produces a name that looks like a metadata file', function () {
    expect(collectionNameToFileName('orders.metadata')).to.equal(
      'orders%2Emetadata'
    );
  });
});

describe('assignFileNames', function () {
  it('keeps names that only differ by case apart', function () {
    const fileNames = assignFileNames(['Orders', 'orders', 'ORDERS'], 'json');
    expect([...fileNames.values()]).to.deep.equal([
      'Orders',
      // No upper case letters to encode, so every letter is encoded.
      '%6F%72%64%65%72%73',
      '%4F%52%44%45%52%53',
    ]);
    const lowerCased = [...fileNames.values()].map((name) =>
      name?.toLowerCase()
    );
    expect(new Set(lowerCased).size).to.equal(3);
  });

  it('does not reuse the name of another collection metadata file', function () {
    const fileNames = assignFileNames(['orders', 'Orders.metadata'], 'json');
    expect(fileNames.get('Orders.metadata')).to.equal('Orders%2Emetadata');
  });
});

describe('exportCollectionsToDirectory with clashing names', function () {
  const cluster = mochaTestServer();
  let dataService: DataService;
  let tmpdir: string;

  beforeEach(async function () {
    tmpdir = path.join(
      os.tmpdir(),
      'compass-export-collections-test',
      `clash-${Date.now()}`
    );
    dataService = await connect({
      connectionOptions: { connectionString: cluster().connectionString },
    });
    await dataService.dropDatabase(`${testDB}-clash`).catch(() => undefined);
    await dataService.insertOne(`${testDB}-clash.Orders`, { upper: true });
    await dataService.insertOne(`${testDB}-clash.orders`, { lower: true });
  });

  afterEach(async function () {
    await fs.promises.rm(tmpdir, { recursive: true, force: true });
    await dataService.disconnect();
  });

  it('writes a separate file for each collection', async function () {
    const result = await exportCollectionsToDirectory({
      databaseName: `${testDB}-clash`,
      collectionNames: ['Orders', 'orders'],
      directoryPath: tmpdir,
      dataService,
      fileType: 'json',
      variant: 'default',
      includeMetadata: false,
    });

    expect(result.collections.map((c) => c.error)).to.deep.equal([
      undefined,
      undefined,
    ]);
    const contents = await Promise.all(
      result.collections.map(({ filePath }) =>
        fs.promises.readFile(filePath, 'utf8')
      )
    );
    expect(contents[0]).to.include('upper');
    expect(contents[1]).to.include('lower');
  });
});
