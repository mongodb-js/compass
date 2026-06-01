import { MongoClient } from 'mongodb';
import type { Db, MongoServerError } from 'mongodb';
import {
  Binary,
  BSONRegExp,
  BSONSymbol,
  Code,
  DBRef,
  Decimal128,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
  UUID,
} from 'bson';
import { getDefaultConnectionStrings } from './test-runner-context.ts';
import { redactConnectionString } from 'mongodb-connection-string-url';
import { noServerWarningsCheckpoint } from './test-runner-global-fixtures.ts';

// This is a list of all the known database names that get created by tests so
// that we can know what to drop when we clean up before every test. If a new
// test starts to create another database, add it here so that it will also be
// cleaned up.
const dbNames = [
  'test',
  'my-sidebar-database',
  'my-instance-database',
  'fle-test',
  'db-for-fle',
];

// These get added to the 'test' database for each client in
// createDummyCollections(). It is sometimes handy to have an empty collection
// already created so that the test can operate on it without first having to
// create it itself.
const testCollectionNames = [
  'json-array',
  'json-file',
  'extended-json-file',
  'csv-file',
  'array-documents',
  'bom-csv-file',
  'latin1',
  'broken-delimiter',
  'numbers',
  'import-stop-first-error',
  'import-with-errors',
  'compass-import-abort-e2e-test',
];

// lots of collections to test virtual scrolling
for (let i = 0; i < 26; ++i) {
  testCollectionNames.push('zzz' + String.fromCharCode('a'.charCodeAt(0) + i));
}

let clients: MongoClient[];
let test_dbs: Db[];

export const beforeAll = async () => {
  // Insert data on both connections so that the same databases and collections
  // will exist on both servers and then anything that's not properly scoped to
  // the correct connection has a chance to operate on the wrong one and
  // hopefully fail a test.
  // This should also mean that the database or collection name that we try and
  // use is always ambiguous, so we're forced to deal with it early in tests.
  const connectionStrings = getDefaultConnectionStrings();
  clients = connectionStrings.map(
    (connectionString) => new MongoClient(connectionString)
  );

  await Promise.all(clients.map((client) => client.connect()));

  const connectionsForPrinting = connectionStrings
    .map((str) => {
      return redactConnectionString(str);
    })
    .join(' and ');

  console.log(
    `Connected successfully to ${connectionsForPrinting} for inserting data`
  );

  test_dbs = clients.map((client) => client.db('test'));
};

export const afterAll = async () => {
  await Promise.all(clients.map((client) => client.close()));
};

export const beforeEach = async () => {
  // Drop the databases that get created by tests or the functions below
  const promises = [];

  for (const client of clients) {
    for (const dbName of dbNames) {
      promises.push(_dropDatabase(client.db(dbName)));
    }
  }

  await Promise.all(promises);
};

export const afterEach = () => {
  // Check for unexpected server warnings after each test
  noServerWarningsCheckpoint();
};

export const mochaRootHooks: Mocha.RootHookObject = {
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
};

export async function createDummyCollections(): Promise<void> {
  const promises = [];

  for (const db of test_dbs) {
    // Create some empty collections for the import tests so each one won't have
    // to possibly drop and create via the UI every time.
    // (named loosely after the relevant test)
    for (const collectionName of testCollectionNames) {
      promises.push(_createBlankCollection(db, collectionName));
    }
  }
  await Promise.all(promises);
}

export async function createNestedDocumentsCollection(
  name = 'nestedDocs',
  numberOfRecords = 1000
): Promise<void> {
  await Promise.all(
    test_dbs.map(async (db) => {
      await db.collection(name).insertMany(
        [...Array(numberOfRecords).keys()].map((i) => ({
          names: {
            firstName: `${i}-firstName`,
            lastName: `${i}-lastName`,
          },
          addresses: [`${i}-address1`, `${i}-address2`],
          phoneNumbers: [
            {
              label: `${i}-home`,
              number: `${i}-12345`,
            },
            {
              label: `${i}-work`,
              number: `${i}-6789`,
            },
          ],
        }))
      );
    })
  );
}

const allTypesDoc = {
  double: new Double(1.2),
  primitiveDouble: 1.2,
  doubleThatIsAlsoAnInteger: new Double(1),
  string: 'Hello, world!',
  object: { key: 'value' },
  array: [1, 2, 3],
  binData: new Binary(Uint8Array.from([1, 2, 3])),
  objectId: new ObjectId('642d766c7300158b1f22e975'),
  boolean: true,
  date: new Date('2023-04-05T13:25:08.445Z'),
  null: null,
  regex: new BSONRegExp('pattern', 'i'),
  javascript: new Code('function() {}'),
  symbol: new BSONSymbol('symbol'),
  javascriptWithScope: new Code('function() {}', {
    foo: 1,
    bar: 'a',
  }),
  int: new Int32(12345),
  primitiveInt: 12345,
  timestamp: new Timestamp(new Long('7218556297505931265')),
  long: new Long('123456789123456789'),
  decimal: new Decimal128(
    Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
  ),
  minKey: new MinKey(),
  maxKey: new MaxKey(),

  binaries: {
    generic: new Binary(Uint8Array.from([1, 2, 3]), 0),
    functionData: Binary.createFromBase64('//8=', 1),
    binaryOld: Binary.createFromBase64('//8=', 2),
    uuidOld: Binary.createFromBase64('c//SZESzTGmQ6OfR38A11A==', 3),
    uuid: new UUID('AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA'),
    md5: Binary.createFromBase64('c//SZESzTGmQ6OfR38A11A==', 5),
    encrypted: Binary.createFromBase64('c//SZESzTGmQ6OfR38A11A==', 6),
    compressedTimeSeries: Binary.createFromBase64(
      'CQCKW/8XjAEAAIfx//////////H/////////AQAAAAAAAABfAAAAAAAAAAEAAAAAAAAAAgAAAAAAAAAHAAAAAAAAAA4AAAAAAAAAAA==',
      7
    ),
    custom: Binary.createFromBase64('//8=', 128),
  },

  dbRef: new DBRef('namespace', new ObjectId('642d76b4b7ebfab15d3c4a78')),
};

export async function createSidebarDatabase(): Promise<void> {
  const promises = [];

  for (const client of clients) {
    promises.push(
      client
        .db('my-sidebar-database')
        .collection('my-sidebar-collection')
        .insertMany(
          [...Array(5).keys()].map((i) => ({
            docIndex: i,
            ...allTypesDoc,
          }))
        )
    );
  }
  await Promise.all(promises);
}

export async function createNumbersCollection(
  name = 'numbers',
  numberOfRecords = 1000,
  createView = false
): Promise<void> {
  await Promise.all(
    test_dbs.map(async (db) => {
      await db
        .collection(name)
        .insertMany(
          [...Array(numberOfRecords).keys()].map((i) => ({ i, j: 0 }))
        );
      if (createView) {
        await db.createCollection(`${name}_view`, {
          viewOn: name,
          pipeline: [{ $match: { _id: { $exists: true } } }],
        });
      }
    })
  );
}

// Useful for testing collation with `numericOrdering`.
export async function createNumbersStringCollection(
  name = 'numbers-strings',
  numberOfRecords = 10
): Promise<void> {
  await Promise.all(
    test_dbs.map(async (db) => {
      await db.collection(name).insertMany(
        [...Array(numberOfRecords).keys()].map((i) => ({
          i,
          iString: `${i * 20}`,
          j: 0,
        }))
      );
    })
  );
}

export async function createGeospatialCollection(
  name = 'geospatial'
): Promise<void> {
  await Promise.all(
    test_dbs.map(async (db) => {
      const lon = () => Math.random() * 360 - 180;
      const lat = () => Math.random() * 180 - 90;

      await db.collection(name).insertMany(
        [...Array(1000).keys()].map(() => ({
          location: { type: 'Point', coordinates: [lon(), lat()] },
        }))
      );
    })
  );
}

// WARNING: please don't export _dropDatabase because this file is written to
// manage ALL test databases and collections and clean them up. If we start
// creating arbitrary databases and collections in tests then those tests have
// to start managing arbitrary cleanup too, defeating the purpose.
// Anything you put in the beforeEach hook above will be dropped automatically.
async function _dropDatabase(db: Db) {
  try {
    await db.dropDatabase();
  } catch (err) {
    const codeName = (err as MongoServerError).codeName;
    if (codeName !== 'NamespaceNotFound') {
      throw err;
    }
  }
}

// WARNING: please don't export _createBlankCollection because this file is
// written to manage ALL test dataases and collections and clean them up. If we
// start creating arbitrary databases and collections in tests then those tests
// have to start managing arbitrary cleanup too, defeating the purpose.
// Just add more to createDummyCollections(), but really anything you put inside
// one of the databases that get dropped in the beforeEach hook above will be
// dropped automatically.
async function _createBlankCollection(db: Db, name: string) {
  try {
    await db.createCollection(name);
  } catch (err) {
    const codeName = (err as MongoServerError).codeName;
    if (codeName === 'NamespaceExists') {
      await db.collection(name).deleteMany({});
    } else {
      throw err;
    }
  }
}
