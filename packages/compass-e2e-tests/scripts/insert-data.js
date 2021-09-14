const { MongoClient } = require('mongodb');

const CONNECTION_URI = 'mongodb://localhost:27018';

async function insertData(client) {
  const db = client.db('test');
  const collection = db.collection('numbers');
  await drop(collection);
  return collection.insertMany([...Array(1000).keys()].map((i) => ({ i })));
}

async function drop(collection) {
  try {
    await collection.drop();
  } catch (err) {
    if (err.codeName !== 'NamespaceNotFound') {
      throw err;
    }
  }
}

if (require.main === module) {
  let client;

  const run = async () => {
    client = new MongoClient(CONNECTION_URI);
    await client.connect();
    console.log('Connected successfully to server');
    return insertData(client);
  };

  run()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => client.close());
}
