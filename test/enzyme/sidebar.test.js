/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const AppRegistry = require('hadron-app-registry');
const { shallow } = require('enzyme');
const Sidebar = require('../../src/internal-packages/sidebar/lib/components/sidebar');
const InstanceStore = require('../../src/internal-packages/app/lib/stores/instance-store');

chai.use(chaiEnzyme());

const appDataService = app.dataService;
const appRegistry = app.appRegistry;
const stateStore = {
  state: {
    isWritable: true
  },
  listen: () => {}
};

describe('<Sidebar />', () => {
  beforeEach(function() {
    global.hadronApp = app;
    app.appRegistry = new AppRegistry();
    this.DatabaseDDLActionSpy = sinon.spy();
    app.appRegistry.registerStore('DeploymentAwareness.WriteStateStore', stateStore);
    app.appRegistry.registerAction(
      'DatabaseDDL.Actions',
      {openCreateDatabaseDialog: this.DatabaseDDLActionSpy}
    );
    app.appRegistry.registerStore('App.InstanceStore', InstanceStore);
    app.dataService = {
      isWritable: () => {
        return true;
      }
    };
  });
  afterEach(() => {
    app.dataService = appDataService;
    app.appRegistry = appRegistry;
  });

  context('when is not writable', function() {
    beforeEach(function() {
      stateStore.state.isWritable = false;
      stateStore.state.description = 'not writable';
      this.component = shallow(
        <Sidebar
          databases={[]}
          activeNamespace={''}
        />);
    });
    it('warns the create database button is not available on secondaries', function() {
      const expected = 'not writable';
      const element = this.component.find('.compass-sidebar-button-create-database-container');
      expect(element.prop('data-tip')).to.be.equal(expected);
    });
    it('create database button contains a disabled BEM modifer class', function() {
      const element = this.component.find('.compass-sidebar-button-create-database');
      expect(element.hasClass('compass-sidebar-button-is-disabled')).to.be.true;
    });
    it('the create database button triggers no action', function() {
      const element = this.component.find('.compass-sidebar-button-create-database');
      element.simulate('click');
      expect(this.DatabaseDDLActionSpy.called).to.be.false;
    });
  });

  context('when is writable', () => {
    beforeEach(function() {
      stateStore.state.isWritable = true;
      this.component = shallow(
      <Sidebar
        databases={[]}
        activeNamespace={''}
      />);
    });
    it('renders a create database button with no tooltip', function() {
      const element = this.component.find('.compass-sidebar-button-create-database');
      expect(element.prop('data-tip')).to.be.undefined;
    });
    it('clicking the create database button triggers an action', function() {
      const element = this.component.find('.compass-sidebar-button-create-database');
      element.simulate('click');
      expect(this.DatabaseDDLActionSpy.calledOnce).to.be.true;
    });
  });
});
