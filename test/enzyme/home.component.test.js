/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const { expect } = require('chai');
const React = require('react');
const sinon = require('sinon');
const { shallow } = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { StatusRow } = require('hadron-react-components');
const { UI_STATES } = require('../../src/internal-plugins/home/lib/constants');
const InstanceComponent = require('../../src/internal-plugins/instance/lib/component');

describe('<Home />', () => {
  const appRegistry = app.appRegistry;
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

    app.appRegistry.registerRole('Application.Connect', sinon.spy());

    this.Home = require('../../src/internal-plugins/home/lib/component/home');
  });
  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.instance = appInstance;
  });

  context('when loading navigation and is not writable', () => {
    beforeEach(() => {
      stateStore.state.isWritable = false;
    });

    // TODO: Need a non-global status component
    it.skip('displays a loading message', () => {
      const expected = 'Loading navigation';
      const component = shallow(<this.Home
          uiStatus={UI_STATES.LOADING}
      />);
      expect(component.find('.home-loading').text()).to.be.equal(expected);
    });
  });

  context('when loaded navigation with error', () => {
    beforeEach(() => {
      stateStore.state.isWritable = false;
    });

    it('displays an error message', () => {
      const innerError = 'not master and slaveOk=false';
      const expected = `An error occurred while loading navigation: ${innerError}`;
      const component = shallow(<this.Home
          errorMessage={innerError}
          uiStatus={UI_STATES.ERROR}
          isConnected
      />);
      expect(component.find(StatusRow).dive().text()).to.include(innerError);
    });
  });

  context('when loaded navigation successfully', () => {
    beforeEach(() => {
      stateStore.state.isWritable = false;

      // Add in a real component to more easily see there isn't an error shown
      app.appRegistry.registerComponent('Instance.Instance', InstanceComponent);
    });

    it('has a tab navigation bar', () => {
      const INSTANCE_LEVEL_NAMESPACE = '';
      const expected = '<spy /><InstanceComponent />' + '<spy />'.repeat(5);
      const component = shallow(<this.Home
          namespace={INSTANCE_LEVEL_NAMESPACE}
          uiStatus={UI_STATES.COMPLETE}
          isConnected
      />);
      expect(component.text()).to.be.equal(expected);
    });
  });
});
