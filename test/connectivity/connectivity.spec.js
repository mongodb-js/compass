const { expect } = require('chai');
const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');
const jsdomGlobal = require('jsdom-global');
const m = require('module');
const React = require('react');
const debug = require('debug')('connectivity-test');
const { promisify } = require('util');
const sinon = require('sinon');

Enzyme.configure({ adapter: new Adapter() });
const { mount } = Enzyme;

// Stub electron module for tests
const originalLoader = m._load;
const stubs = {
  electron: {
    ipcMain: {
      call: (methodName) => {
        debug('electron.ipcMain.call main called!', methodName);
      },
      respondTo: (methodName) => {
        debug('electron.ipcMain.respondTo main called!', methodName);
      },
      on: (methodName) => {
        debug('electron.ipcMain.on main called!', methodName);
      }
    },
    remote: {
      app: {
        getName: () => 'Compass Connectivity Integration Test Suite',
        getPath: () => ''
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

const {
  dockerComposeDown,
  dockerComposeUp
} = require('./docker-instance-manager');

// Hide react warnings.
// eslint-disable-next-line no-console
const originalWarn = console.warn.bind(console.warn);
// eslint-disable-next-line no-console
console.warn = (msg) => (
  !msg.toString().includes('componentWillReceiveProps')
  && !msg.toString().includes('componentWillUpdate')
  && originalWarn(msg)
);

const delay = promisify(setTimeout);

const connectionsToTest = [{
  title: 'local community standalone',
  dockerComposeFilePath: 'community/docker-compose.yaml',
  model: {
    hostname: 'localhost',
    port: 27020,
  },
  expectedInstanceDetails: {
    _id: 'localhost:27020',
    authenticatedUsers: [],
    build: {
      raw: {
        version: /4.4.[1-9]+$/
      }
    },
    client: {
      isWritable: true,
      isMongos: false,
    },
    dataLake: { isDataLake: false, version: null },
    genuineMongoDB: { isGenuine: true, dbType: 'mongodb' },
    host: {
      os: 'Ubuntu',
      os_family: 'linux',
      kernel_version: '18.04',
      arch: 'x86_64'
    },
    hostname: 'localhost',
    port: 27020
  }
}];

function getCompassConnectStore(appRegistry, testConnectionModel) {
  const compassConnectStore = appRegistry.getStore('Connect.Store');

  // Remove all logic around saving and loading stored connections.
  // NOTE: This is tightly coupled with the store in compass-connect.
  // https://github.com/mongodb-js/compass-connect/blob/master/src/stores/index.js
  compassConnectStore._saveRecent = () => {};
  compassConnectStore._saveConnection = () => {};
  compassConnectStore.state.fetchedConnections = [];
  compassConnectStore.StatusActions = {
    done: () => {},
    showIndeterminateProgressBar: () => {}
  };
  compassConnectStore.appRegistry = appRegistry;

  // Load the connection into our connection model.
  const connectionModel = new Connection(testConnectionModel);
  debug('Created model with connection string:', connectionModel.safeUrl);

  // Load the connection model through compass-connect and render it.
  // Load the connection into compass-connect's connection model.
  compassConnectStore.state.currentConnection = connectionModel;
  compassConnectStore.trigger(compassConnectStore.state);

  // Here we use the parsed connection model and build a url.
  // This is something that would occur if
  // a user is switching between the connection views and editing.
  compassConnectStore.state.customUrl = compassConnectStore.state.currentConnection.driverUrlWithSsh;
  compassConnectStore.trigger(compassConnectStore.state);

  return compassConnectStore;
}

describe('Connectivity', () => {
  connectionsToTest.forEach(({
    dockerComposeFilePath,
    expectedInstanceDetails,
    model: testConnectionModel,
    title: testConnectionTitle
  }) => {
    let wrapper;
    let appRegistry;
    let compassConnectStore;

    before(async() => {
      dockerComposeUp(dockerComposeFilePath);

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

      compassConnectStore = getCompassConnectStore(appRegistry, testConnectionModel);

      wrapper = mount(<CompassConnectComponent />);

      // Ensures the model doesn't cause any errors when rendering.
      await compassConnectStore.validateConnectionString();
    });

    after(() => {
      deactivateCompassConnect(appRegistry);

      dockerComposeDown(dockerComposeFilePath);
    });

    it('doesn\'t have any compass connect store errors when rendering', () => {
      expect(compassConnectStore.state.errorMessage).to.equal(null);
      expect(compassConnectStore.state.syntaxErrorMessage).to.equal(null);
      expect(compassConnectStore.state.isValid).to.equal(true);
    });

    context(`Connection ${testConnectionTitle} successfully connects`, () => {
      let dataService;
      let instanceDetails;
      let onDataServiceConnected;

      before(async() => {
        onDataServiceConnected = sinon.spy();
        appRegistry.on('data-service-connected', onDataServiceConnected);

        const waitDataserviceConnected = promisify(
          appRegistry.once.bind(appRegistry, 'data-service-connected')
        );

        // Mock the animation requesting for the connect modal.
        window.requestAnimationFrame = sinon.fake();

        // Simulate clicking connect.
        wrapper.find('button[name="connect"]').simulate('click');

        await waitDataserviceConnected();

        dataService = compassConnectStore.dataService;

        // Fetch the instance details using the new connection.
        const runFetchInstanceDetails = promisify(dataService.instance.bind(dataService));
        instanceDetails = await runFetchInstanceDetails({});
      });

      after(async() => {
        if (dataService) {
          const runDisconnect = promisify(dataService.disconnect.bind(dataService));
          await runDisconnect();
        }
      });

      it('does not have any compass connect store errors after connecting', () => {
        expect(compassConnectStore.state.errorMessage).to.equal(null);
        expect(compassConnectStore.state.syntaxErrorMessage).to.equal(null);
        expect(compassConnectStore.state.isValid).to.equal(true);
      });

      it('calls the data-service-connected event without an error', () => {
        expect(onDataServiceConnected.firstCall.args[0]).to.equal(null);
      });

      it('calls the data-service-connected event with the dataservice', () => {
        expect(onDataServiceConnected.firstCall.args[1]).to.equal(dataService);
      });

      it('has the correct instance _id', () => {
        expect(instanceDetails._id).to.equal(
          expectedInstanceDetails._id
        );
      });

      it('has the correct host details', () => {
        Object.keys(expectedInstanceDetails.host).forEach(hostDetailKey => {
          expect(instanceDetails.host[hostDetailKey]).to.equal(
            expectedInstanceDetails.host[hostDetailKey]
          );
        });
      });

      it('has the correct mongodb version in the build info', () => {
        expect(instanceDetails.build.raw.version.match(
          expectedInstanceDetails.build.raw.version
        ).length).to.equal(1);
      });

      it('has the correct client isWritable set', () => {
        expect(instanceDetails.client.isWritable).to.equal(
          expectedInstanceDetails.client.isWritable
        );
      });

      it('has the correct client isMongos set', () => {
        expect(instanceDetails.client.isMongos).to.equal(
          expectedInstanceDetails.client.isMongos
        );
      });

      it('has the correct datalake attributes', () => {
        expect(instanceDetails.dataLake).to.deep.equal(
          expectedInstanceDetails.dataLake
        );
      });

      it('has the correct genuineMongoDB attributes', () => {
        expect(instanceDetails.genuineMongoDB).to.deep.equal(
          expectedInstanceDetails.genuineMongoDB
        );
      });

      it('has the correct hostname', () => {
        expect(instanceDetails.hostname).to.equal(
          expectedInstanceDetails.hostname
        );
      });

      it('has the correct port', () => {
        expect(instanceDetails.port).to.equal(
          expectedInstanceDetails.port
        );
      });

      it('calls \'data-service-connected\' only once', async() => {
        await delay(1000);
        expect(onDataServiceConnected.callCount).to.equal(1);
      });

      it('is connected as the correct user', async() => {
        const runCommand = promisify(
          dataService.command.bind(dataService)
        );
        const connectionStatus = await runCommand(
          'admin',
          {
            connectionStatus: 1
          }
        );
        expect(connectionStatus.authInfo.authenticatedUsers).to.deep.equal(
          expectedInstanceDetails.authenticatedUsers
        );
      });
    });
  });
});
