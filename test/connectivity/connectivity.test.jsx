const { expect } = require('chai');
const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const React = require('react');

Enzyme.configure({ adapter: new Adapter() });
const mount = Enzyme.mount;

const util = require('util');
const jsdomGlobal = require('jsdom-global');

// Stub electron module for tests
const m = require('module');
const originalLoader = m._load;
const stubs = {
  electron: {
    ipcMain: {
      call: (methodName) => {
        console.log('electron.ipcMain.call main called!', methodName);
      },
      respondTo: (methodName) => {
        console.log('electron.ipcMain.respondTo main called!', methodName);
      },
      on: (methodName) => {
        console.log('electron.ipcMain.on main called!', methodName);
      }
    },
    remote: {
      app: {
        getName: () => 'Compass Connectivity Integration Test Suite'
      },
      dialog: {
        remote: {},
        BrowserWindow: {}
      }
    },
    shell: {}
  }
};
m._load = function hookedLoader(request, parent, isMain) {
  const stub = stubs[request];
  return stub || originalLoader(request, parent, isMain);
};

// Mock dom/window for tests.
// Has to come before @mongodb-js/compass-connect require.
jsdomGlobal();

const AppRegistry = require('hadron-app-registry');
const Connection = require('mongodb-connection-model');
const CompassConnectPlugin = require('@mongodb-js/compass-connect');
const CompassConnectComponent = CompassConnectPlugin.default;
const activateCompassConnect = CompassConnectPlugin.activate;
const deactivateCompassConnect = CompassConnectPlugin.deactivate;

const promisifyInstanceDetailsFetching = (dataService) => {
  return new Promise((resolve, reject) => {
    dataService.instance({}, (err, instanceDetails) => {
      if (err) {
        return reject(err);
      }

      return resolve(instanceDetails);
    });
  });
};

const promisifyDisconnect = (dataService) => {
  return new Promise((resolve, reject) => {
    dataService.disconnect((err) => {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });
};

const delay = util.promisify(setTimeout);
const ensureConnected = async(timeout, testIsConnected) => {
  let connected = await testIsConnected();
  while (!connected) {
    console.log(`looping at timeout=${timeout}, connected=${connected}`);
    if (timeout > 30000) {
      throw new Error('Waited for connection, never happened');
    }
    await delay(timeout);
    timeout *= 2; // Try again but wait double.
    connected = await testIsConnected();
  }
  return connected;
};

const connectionsToTest = [{
  title: 'default local',
  model: {
    hostname: 'localhost',
    port: 27017
  },
  expectedInstanceDetails: {
    // host: ['client', 'db', getHostInfo],
    // build: ['client', 'db', getBuildInfo],
    genuineMongoDB: { isGenuine: true, dbType: 'mongodb' },
    dataLake: { isDataLake: false, version: null },

    databases: [], // Each database also collections array has which getHierarchy sets.

    collections: [],

    // Has totals for all dbs. keys with number values are 'document_count', 'storage_size', 'index_count', 'index_size'
    stats: {
      document_count: 3,
      storage_size: 123,
      index_count: 1,
      index_size: 123
    }
  }
}];

describe('Connectivity', () => {
  let appRegistry;
  before(() => {
    appRegistry = new AppRegistry();

    activateCompassConnect(appRegistry);

    global.hadronApp = {
      appRegistry
    };

    const ROLE = {
      name: 'Status',
      component: () => (<div id="statusPlugin">Status</div>)
    };
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerRole('Application.Status', ROLE);
  });

  after(() => {
    deactivateCompassConnect(appRegistry);
  });

  context('Connection can connect', () => {
    connectionsToTest.forEach(connection => {
      it('loads connection, connects, and loads instance information', async() => {
        // 1. Load the connection into our connection model.
        const model = new Connection(connection.model);

        // 2. Load the connection model through compass-connect and render it.

        // TODO: Render it both in string view and connect form view.
        // Connect with both?

        // This ensures the model doesn't cause any errors when rendering
        // and attempting to connect from there.

        const compassConnectStore = appRegistry.getStore('Connect.Store');

        // Remove all logic around saving and loading stored connections.
        // NOTE: This is tightly coupled with the store in compass-connect.
        compassConnectStore._saveRecent = () => {};
        compassConnectStore._saveConnection = () => {};
        compassConnectStore.state.fetchedConnections = [];
        compassConnectStore.StatusActions = { showIndeterminateProgressBar: () => {} };
        compassConnectStore.appRegistry = appRegistry;

        // Load the connection into compass-connect's connection model.
        compassConnectStore.state.currentConnection = model;
        compassConnectStore.trigger(compassConnectStore.state);

        let timesConnectedCalled = 0;
        let dataServiceConnected = false;
        let dataServiceConnectedErr;
        appRegistry.on('data-service-connected', (err) => {
          timesConnectedCalled++;
          dataServiceConnected = true;
          dataServiceConnectedErr = err;
        });

        // Simulate clicking connect.
        const wrapper = mount(<CompassConnectComponent />);
        wrapper.find({
          name: 'connect'
        }).simulate('click');

        // 3. Wait for the connection event to occur.
        await ensureConnected(100, () => dataServiceConnected);

        if (dataServiceConnectedErr) {
          throw dataServiceConnectedErr;
        }

        if (timesConnectedCalled > 1) {
          throw new Error('data-service-connected called multiple times');
        }

        const dataService = compassConnectStore.dataService;

        // 4. Fetch the instance details using the new connection.
        const instanceDetails = await promisifyInstanceDetailsFetching(dataService);

        await promisifyDisconnect(dataService);

        // 5. Ensure the connection details are what we expect.
        Object.keys(connection.expectedInstanceDetails).forEach(detailKey => {
          expect(instanceDetails[detailKey]).to.deep.equal(
            connection.expectedInstanceDetails[detailKey]
          );
        });
      });
    });
  });
});
