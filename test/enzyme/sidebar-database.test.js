/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const AppRegistry = require('hadron-app-registry');
const { shallow } = require('enzyme');
const SidebarDatabase = require('../../src/internal-packages/sidebar/lib/components/sidebar-database');

chai.use(chaiEnzyme());

const appDataService = app.dataService;
const appRegistry = app.appRegistry;
const stateStore = {
  state: {
    isWritable: true
  },
  listen: () => {}
};

describe('<SidebarDatabase />', () => {
  beforeEach(function() {
    global.hadronApp = app;
    app.appRegistry = new AppRegistry();
    app.appRegistry.registerStore('DeploymentAwareness.DeploymentStateStore', stateStore);
    this.DatabaseDDLActionSpyCreate = sinon.spy();
    this.DatabaseDDLActionSpyDrop = sinon.spy();
    app.appRegistry.registerAction(
      'Database.CollectionsActions',
      {openCreateCollectionDialog: this.DatabaseDDLActionSpyCreate}
    );
    app.appRegistry.registerAction(
      'DatabaseDDL.Actions',
      {openDropDatabaseDialog: this.DatabaseDDLActionSpyDrop}
    );
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
        <SidebarDatabase
          _id="foo"
          activeNamespace={''}
        />);
    });
    it('create collection contains a disabled BEM modifer class', function() {
      const element = this.component.find('.compass-sidebar-icon-create-collection');
      expect(element.hasClass('compass-sidebar-icon-is-disabled')).to.be.true;
    });
    it('warns the create collection icon does not work on secondaries', function() {
      const expected = 'not writable';
      const element = this.component.find('.compass-sidebar-icon-create-collection');
      expect(element.prop('data-tip')).to.be.equal(expected);
    });
    it('the create collection icon triggers no action', function() {
      const element = this.component.find('.compass-sidebar-icon-create-collection');
      element.simulate('click');
      expect(this.DatabaseDDLActionSpyCreate.called).to.be.false;
    });

    it('drop database contains a disabled BEM modifer class', function() {
      const element = this.component.find('.compass-sidebar-icon-drop-database');
      expect(element.hasClass('compass-sidebar-icon-is-disabled')).to.be.true;
    });
    it('warns the drop database icon does not work on secondaries', function() {
      const expected = 'Drop database is not available on a secondary node';
      const element = this.component.find('.compass-sidebar-icon-drop-database');
      expect(element.prop('data-tip')).to.be.equal(expected);
    });
    it('the drop database icon triggers no action', function() {
      const element = this.component.find('.compass-sidebar-icon-drop-database');
      element.simulate('click');
      expect(this.DatabaseDDLActionSpyDrop.called).to.be.false;
    });
  });

  context('when dataService is writable', () => {
    beforeEach(function() {
      stateStore.state.isWritable = true;
      this.component = shallow(
      <SidebarDatabase
        _id="foo"
        activeNamespace={''}
      />);
    });
    it('renders a create collection icon with tooltip', function() {
      const expected = 'Create collection';
      const element = this.component.find('.compass-sidebar-icon-create-collection');
      expect(element.prop('data-tip')).to.be.equal(expected);
    });
    it('clicking the create collection icon triggers an action', function() {
      const element = this.component.find('.compass-sidebar-icon-create-collection');
      element.simulate('click');
      expect(this.DatabaseDDLActionSpyCreate.calledOnce).to.be.true;
    });

    it('renders a drop database icon with tooltip', function() {
      const expected = 'Drop database';
      const element = this.component.find('.compass-sidebar-icon-drop-database');
      expect(element.prop('data-tip')).to.be.equal(expected);
    });
    it('clicking the drop database icon triggers an action', function() {
      const element = this.component.find('.compass-sidebar-icon-drop-database');
      element.simulate('click');
      expect(this.DatabaseDDLActionSpyDrop.calledOnce).to.be.true;
    });
  });
});
