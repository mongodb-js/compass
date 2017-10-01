/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const AppRegistry = require('hadron-app-registry');
const { shallow } = require('enzyme');
const SidebarInstanceProperties = require('../../src/internal-plugins/sidebar/lib/components/sidebar-instance-properties');
const { LOADING_STATE } = require('../../src/internal-plugins/sidebar/lib/constants');

chai.use(chaiEnzyme());

const appRegistry = app.appRegistry;

describe('<SidebarInstanceProperties />', () => {
  beforeEach(function() {
    app.appRegistry = new AppRegistry();
    this.DatabaseDDLActionSpy = sinon.spy();
    app.appRegistry.registerAction(
      'DatabaseDDL.Actions',
      {openCreateDatabaseDialog: this.DatabaseDDLActionSpy}
    );
  });
  afterEach(() => {
    app.appRegistry = appRegistry;
  });
  context('when dataService is not writable and databases is loading', function() {
    beforeEach(function() {
      app.dataService = {
        isWritable: () => {
          return false;
        }
      };
      const instance = {
        collections: LOADING_STATE,
        databases: LOADING_STATE
      };
      this.component = shallow(
        <SidebarInstanceProperties
          instance={instance}
          activeNamespace={''}
        />);
    });
    it('shows - DBs and - COLLECTIONS as a loading state', function() {
      const expected = '- DBs- Collections';
      expect(this.component.text()).to.be.equal(expected);
    });
  });
});
