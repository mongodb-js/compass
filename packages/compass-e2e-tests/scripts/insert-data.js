const { MongoClient } = require('mongodb');

const CONNECTION_URI = 'mongodb://localhost:27017';

function insertData(client) {
  const db = client.db('test');
  const collection = db.collection('numbers');
  return collection.insertMany([...Array(1000).keys()].map(i => ({i})));
}

if (require.main === module) {
  let client;

  const run = async () => {
    client = new MongoClient(CONNECTION_URI);
    await client.connect();
    console.log('Connected successfully to server');
    return insertData(client);
  }

  run()
    .then(console.log)
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => client.close());
}
