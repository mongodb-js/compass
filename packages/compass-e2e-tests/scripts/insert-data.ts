import { MongoClient } from 'mongodb';
import type { Db, MongoServerError } from 'mongodb';

const CONNECTION_URI = 'mongodb://localhost:27018';

async function dropDatabase(db: Db) {
  try {
    await db.dropDatabase();
  } catch (err) {
    const codeName = (err as MongoServerError).codeName;
    if (codeName !== 'NamespaceNotFound') {
      throw err;
    }
  }
}

async function createBlankCollection(db: Db, name: string) {
  console.log(`Creating ${db.databaseName}.${name}`);
  await db.createCollection(name);
}

if (require.main === module) {
  let client: MongoClient;

  const run = async () => {
    client = new MongoClient(CONNECTION_URI);
    await client.connect();
    console.log('Connected successfully to server');

    // Drop the databases that get created by tests just in case tests failed to
    // clean them up.
    await dropDatabase(client.db('my-sidebar-database'));
    await dropDatabase(client.db('my-instance-database'));

    const db = client.db('test');

    // Drop the entire test db where we create lots of collections during test runs
    await dropDatabase(db);

    const promises = [];

    // Create some empty collections for the import tests so each one won't have
    // to possibly drop and create via the UI every time.
    // (named loosely after the relevant test)
    promises.push(createBlankCollection(db, 'json-array'));
    promises.push(createBlankCollection(db, 'json-file'));
    promises.push(createBlankCollection(db, 'extended-json-file'));
    promises.push(createBlankCollection(db, 'csv-file'));
    promises.push(createBlankCollection(db, 'bom-csv-file'));
    promises.push(createBlankCollection(db, 'numbers'));

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

    console.log(`Populating test.numbers`);
    await db
      .collection('numbers')
      .insertMany([...Array(1000).keys()].map((i) => ({ i })));
  };

  run()
    .catch((err: Error) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => void client.close());
}
