
/**
Test:
Pull in fixture - with connection model?
Connect with compass-connect using built connection model.
Get data-service going.
run instance model
make sure no errors - can we catch all errors?
Check instance model and resulting connection is what we expect.

**/

const { expect } = require('chai');
const { render } = require('enzyme');

const AppRegistry = require('hadron-app-registry');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const CompassConnectPlugin = require('compass-connect');

const activateCompassConnect = CompassConnectPlugin.activate;

function promisifyConnect(dataService) {
  return new Promise((resolve, reject) => {
    dataService.connect((err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
}

function promisifyInstanceDetailsFetching(dataService) {
  return new Promise((resolve, reject) => {
    dataService.instance((err, instanceDetails) => {
      if (err) {
        return reject(err);
      }

      return resolve(instanceDetails);
    });
  });
}

const connectionsToTest = [{
  model: {
    hostname: 'localhost',
    port: 27017
  },
  expectedInstanceDetails: {
    // client: attach.bind(null, client),

    // host: ['client', 'db', getHostInfo],
    // build: ['client', 'db', getBuildInfo],
    genuineMongoDB: true,
    dataLake: false, // Set true for the datalake connection.

    databases: [], // Each database also collections array has which getHierarchy sets.

    collections: [],

    stats: {} // Has totals for all dbs. keys with number values are 'document_count', 'storage_size', 'index_count', 'index_size'
  }
}];

describe('Connectivity', () => {
  let appRegistry;
  before(() => {
    appRegistry = new AppRegistry();

    activateCompassConnect(appRegistry);
  });

  context('Connection can connect', () => {
    connectionsToTest.forEach(connection => {
      it.skip('loads connection, connects, and loads instance information', async() => {
        const model = new Connection(connection.model);

        // TODO: Load connection model through compass-connect and render it.
        // Render it both in string view and connect form view.
        // This ensures the model doesn't cause any errors when rendering
        // and attempting to connect from there.


        const dataService = new DataService(model);

        appRegistry.on('data-service-connected', (err) => {
          if (!err) {
            appRegistry.getAction('Status.Actions').done();
          }
        });

        const wrapper = render(CompassConnectPlugin);

        appRegistry.getStore();

        await promisifyConnect(dataService);

        const instanceDetails = await promisifyInstanceDetailsFetching(dataService);

        Object.keys(connection.expectedInstanceDetails).forEach(detailKey => {
          expect(instanceDetails[detailKey]).to.deep.equal(
            connection.expectedInstanceDetails[detailKey]
          );
        });
      });
    });
  });
});
