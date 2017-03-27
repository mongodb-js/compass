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
const StoreConnector = require('../../src/internal-packages/app/lib/components/store-connector');

chai.use(chaiEnzyme());

const appDataService = app.dataService;
const appRegistry = app.appRegistry;

describe('<Sidebar />', () => {
  beforeEach(function() {
    app.appRegistry = new AppRegistry();
    this.InstanceActionSpy = sinon.spy();
    app.appRegistry.registerAction(
      'Instance.Actions',
      {openCreateDatabaseDialog: this.InstanceActionSpy}
    );
    app.appRegistry.registerComponent('App.StoreConnector', StoreConnector);
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

  context('when dataService is not writable', function() {
    beforeEach(function() {
      app.dataService = {
        isWritable: () => {
          return false;
        }
      };
      this.component = shallow(
        <Sidebar
          databases={[]}
          activeNamespace={''}
        />);
    });
    it('warns the create database button is not available on secondaries', function() {
      const expected = 'Not available on a secondary node';
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
      expect(this.InstanceActionSpy.called).to.be.false;
    });
  });

  context('when dataService is writable', () => {
    beforeEach(function() {
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
      expect(this.InstanceActionSpy.calledOnce).to.be.true;
    });
  });
});
