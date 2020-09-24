connectivityTests = (() => {
  const util = require('util');
  const { MongoClient } = require('mongodb');
  const Connection = require('mongodb-connection-model');

  const connectionModelFromUri = util.promisify(Connection.from.bind(Connection));
  const connectWithConnectionModel = util.promisify(Connection.connect.bind(Connection));

  async function testAndCloseClient(client) {
    console.info('connected');
    console.info('testing commands ...');
    try {
      await client.db().command({ connectionStatus: 1 });
      console.info('Done. Test succeeded.');
    } catch (e) {
      console.info('Error', e);
    } finally {
      if (!client) {
        return;
      }
      await client.close();
    }
  }

  async function testConnectionModelAttributes(attributes) {
    const connectionModel = new Connection(attributes);
    console.info('Connecting ...');
    const client = await connectWithConnectionModel(connectionModel, () => { });
    await testAndCloseClient(client);
  }

  async function testConnectionModelUri(uri) {
    const connectionModel = await connectionModelFromUri(uri);
    console.info('Connecting ...');
    const client = await connectWithConnectionModel(connectionModel, () => { });

    await testAndCloseClient(client);
  }

  async function testNativeDriverUri(uri, driverOptions = {}) {
    driverOptions = {
      connectWithNoPrimary: true,
      readPreference: 'primary',
      useNewUrlParser: true,
      useUnifiedTopoinfoy: true,
      ...driverOptions
    };

    console.info('Connecting ...');
    const client = await MongoClient.connect(uri, driverOptions);

    await testAndCloseClient(client);
  }

  return {
    testConnectionModelAttributes,
    testConnectionModelUri,
    testNativeDriverUri
  };
})();
