import { MongoClient } from 'mongodb';
import type { Db, MongoServerError } from 'mongodb';

const CONNECTION_URI = 'mongodb://localhost:27091';

export async function dropDatabase(db: Db | string) {
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

export async function createBlankCollection(db: Db | string, name: string) {
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

let client: MongoClient;

before(async () => {
  client = new MongoClient(CONNECTION_URI);
  await client.connect();
  console.log('Connected successfully to server for inserting data');
});

after(async () => {
  await client.close();
});

beforeEach(async () => {
  // Drop the databases that get created by tests just in case tests failed to
  // clean them up.
  await Promise.all(
    [
      'test',
      'my-sidebar-database',
      'my-instance-database',
      'fle-test',
      'db-for-fle',
      'multiple-collections',
    ].map((db) => dropDatabase(client.db(db)))
  );
});

export async function createDummyCollections(): Promise<void> {
  const db = client.db('test');
  const promises = [];

  // Create some empty collections for the import tests so each one won't have
  // to possibly drop and create via the UI every time.
  // (named loosely after the relevant test)
  promises.push(createBlankCollection(db, 'json-array'));
  promises.push(createBlankCollection(db, 'json-file'));
  promises.push(createBlankCollection(db, 'extended-json-file'));
  promises.push(createBlankCollection(db, 'csv-file'));
  promises.push(createBlankCollection(db, 'array-documents'));
  promises.push(createBlankCollection(db, 'bom-csv-file'));
  promises.push(createBlankCollection(db, 'latin1'));
  promises.push(createBlankCollection(db, 'broken-delimiter'));
  promises.push(createBlankCollection(db, 'numbers'));
  promises.push(createBlankCollection(db, 'import-stop-first-error'));
  promises.push(createBlankCollection(db, 'import-with-errors'));
  promises.push(createBlankCollection(db, 'compass-import-abort-e2e-test'));

  // lots of collections to test virtual scrolling
  for (let i = 0; i < 26; ++i) {
    promises.push(
      createBlankCollection(
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

export async function createMultipleCollections(): Promise<void> {
  const db = client.db('multiple-collections');

  await db
    .collection('one')
    .insertMany([...Array(10).keys()].map((i) => ({ i, j: 0 })));

  await db
    .collection('two')
    .insertMany([...Array(10).keys()].map((i) => ({ i, j: 0 })));
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
