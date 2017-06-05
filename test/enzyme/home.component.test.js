/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const { expect } = require('chai');
const React = require('react');
const sinon = require('sinon');
const { shallow } = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { UI_STATES } = require('../../src/internal-packages/home/lib/constants');

describe('<Home />', () => {
  const appRegistry = app.appRegistry;
  const appDataService = app.dataService;
  const appInstance = app.instance;
  const stateStore = {
    state: {
      isWritable: true
    },
    listen: () => {}
  };

  beforeEach(() => {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    global.hadronApp = app;
    app.appRegistry = new AppRegistry();

    // TODO: Decide if Home component is aware of DeploymentAwareness.*
    app.appRegistry.registerStore('DeploymentAwareness.WriteStateStore', stateStore);

    // Fixes Warning: React.createElement: ...
    app.appRegistry.registerComponent('InstanceHeader.Component', sinon.spy());
    app.appRegistry.registerComponent('Sidebar.Component', sinon.spy());
    app.appRegistry.registerComponent('DatabaseDDL.CreateDatabaseDialog', sinon.spy());
    app.appRegistry.registerComponent('DatabaseDDL.DropDatabaseDialog', sinon.spy());
    app.appRegistry.registerComponent('Database.CreateCollectionDialog', sinon.spy());
    app.appRegistry.registerComponent('Database.DropCollectionDialog', sinon.spy());

    this.Home = require('../../src/internal-packages/home/lib/component/home');
  });
  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.dataService = appDataService;
    app.instance = appInstance;
  });

  context('when loading navigation and is not writable', () => {
    beforeEach(() => {
      stateStore.state.isWritable = false;
    });

    it('displays a loading message', () => {
      const expected = 'Loading navigation';
      const component = shallow(<this.Home
          uiStatus={UI_STATES.LOADING}
      />);
      expect(component.find('.home-loading').text()).to.be.equal(expected);
    });
  });
});
