const { MongoClient } = require('mongodb');

const CONNECTION_URI = 'mongodb://localhost:27018';

async function dropCollection(db, name) {
  const collection = db.collection(name);
  try {
    await collection.drop();
  } catch (err) {
    if (err.codeName !== 'NamespaceNotFound') {
      throw err;
    }
  }
}

async function createBlankCollection(db, name) {
  console.log(`Creating ${db.databaseName}.${name}`);
  await dropCollection(db, name);
  await db.createCollection(name);
}

if (require.main === module) {
  let client;

  const run = async () => {
    client = new MongoClient(CONNECTION_URI);
    await client.connect();
    console.log('Connected successfully to server');

    const db = client.db('test');

    // Create some empty collections for the import tests so each one won't have
    // to possibly drop and create via the UI every time.
    // (named loosely after the relevant test)
    await createBlankCollection(db, 'json-array');
    await createBlankCollection(db, 'json-file');

    console.log(`Creating test.numbers`);
    await dropCollection(db, 'numbers');
    await db
      .collection('numbers')
      .insertMany([...Array(1000).keys()].map((i) => ({ i })));
  };

  run()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => client.close());
}
