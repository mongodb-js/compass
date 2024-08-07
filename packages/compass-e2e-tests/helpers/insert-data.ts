import { MongoClient } from 'mongodb';
import type { Db, MongoServerError } from 'mongodb';

const CONNECTION_URI = 'mongodb://127.0.0.1:27091';

let client: MongoClient;

before(async () => {
  client = new MongoClient(CONNECTION_URI);
  await client.connect();
  console.log(`Connected successfully to ${CONNECTION_URI} for inserting data`);
});

after(async () => {
  await client.close();
});

beforeEach(async () => {
  // Drop the databases that get created by tests or the functions below
  await Promise.all(
    [
      'test',
      'my-sidebar-database',
      'my-instance-database',
      'fle-test',
      'db-for-fle',
    ].map((db) => _dropDatabase(client.db(db)))
  );
});

export async function createDummyCollections(): Promise<void> {
  const db = client.db('test');
  const promises = [];

  // Create some empty collections for the import tests so each one won't have
  // to possibly drop and create via the UI every time.
  // (named loosely after the relevant test)
  promises.push(_createBlankCollection(db, 'json-array'));
  promises.push(_createBlankCollection(db, 'json-file'));
  promises.push(_createBlankCollection(db, 'extended-json-file'));
  promises.push(_createBlankCollection(db, 'csv-file'));
  promises.push(_createBlankCollection(db, 'array-documents'));
  promises.push(_createBlankCollection(db, 'bom-csv-file'));
  promises.push(_createBlankCollection(db, 'latin1'));
  promises.push(_createBlankCollection(db, 'broken-delimiter'));
  promises.push(_createBlankCollection(db, 'numbers'));
  promises.push(_createBlankCollection(db, 'import-stop-first-error'));
  promises.push(_createBlankCollection(db, 'import-with-errors'));
  promises.push(_createBlankCollection(db, 'compass-import-abort-e2e-test'));

  // lots of collections to test virtual scrolling
  for (let i = 0; i < 26; ++i) {
    promises.push(
      _createBlankCollection(
        db,
        'zzz' + String.fromCharCode('a'.charCodeAt(0) + i)
      )
    );
  }

  await Promise.all(promises);
}

export async function createNestedDocumentsCollection(
  name = 'nestedDocs',
  numberOfRecords = 1000
): Promise<void> {
  const db = client.db('test');
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
}

export async function createNumbersCollection(
  name = 'numbers',
  numberOfRecords = 1000
): Promise<void> {
  const db = client.db('test');

  await db
    .collection(name)
    .insertMany([...Array(numberOfRecords).keys()].map((i) => ({ i, j: 0 })));
}

// Useful for testing collation with `numericOrdering`.
export async function createNumbersStringCollection(
  name = 'numbers-strings',
  numberOfRecords = 10
): Promise<void> {
  const db = client.db('test');

  await db.collection(name).insertMany(
    [...Array(numberOfRecords).keys()].map((i) => ({
      i,
      iString: `${i * 20}`,
      j: 0,
    }))
  );
}

export async function createGeospatialCollection(): Promise<void> {
  const db = client.db('test');

  const lon = () => Math.random() * 360 - 180;
  const lat = () => Math.random() * 180 - 90;

  await db.collection('geospatial').insertMany(
    [...Array(1000).keys()].map(() => ({
      location: { type: 'Point', coordinates: [lon(), lat()] },
    }))
  );
}

// WARNING: please don't export _dropDatabase because this file is written to
// manage ALL test databases and collections and clean them up. If we start
// creating arbitrary databases and collections in tests then those tests have
// to start managing arbitrary cleanup too, defeating the purpose.
// Anything you put in the beforeEach hook above will be dropped automatically.
export async function _dropDatabase(db: Db | string) {
  const database = typeof db === 'string' ? client.db(db) : db;
  try {
    await database.dropDatabase();
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
async function _createBlankCollection(db: Db | string, name: string) {
  const database = typeof db === 'string' ? client.db(db) : db;
  try {
    await database.createCollection(name);
  } catch (err) {
    const codeName = (err as MongoServerError).codeName;
    if (codeName === 'NamespaceExists') {
      await database.collection(name).deleteMany({});
    } else {
      throw err;
    }
  }
}
