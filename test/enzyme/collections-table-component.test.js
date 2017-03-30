/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const {mount} = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { SortableTable, TabNavBar } = require('hadron-react-components');
const HadronTooltip = require('../../src/internal-packages/app/lib/components/hadron-tooltip');

chai.use(chaiEnzyme());

describe('<CollectionsTable />', () => {
  const appRegistry = app.appRegistry;
  const appDataService = app.dataService;
  const appInstance = app.instance;

  beforeEach(() => {
    // Mock the AppRegistry with a new one so tests don't complain about
    // appRegistry.getComponent (i.e. appRegistry being undefined)
    app.appRegistry = new AppRegistry();
    app.appRegistry.registerStore('App.CollectionStore', sinon.spy());

    // TypeError: Cannot read property 'refreshInstance' of undefined
    //   at Store.init (src/internal-packages/server-stats/lib/stores/create-database-store.js:14:28)
    app.appRegistry.registerAction('App.InstanceActions', sinon.spy());

    //  1) <DatabasesTable /> when databases and dataService is writable it
    // "before each" hook for "does not render any message":
    //     Invariant Violation: Element type is invalid: expected a string
    // (for built-in components) or a class/function (for composite components)
    // but got: undefined. Check the render method of `DatabasesTable`.
    app.appRegistry.registerComponent('App.SortableTable', SortableTable);
    app.appRegistry.registerComponent('App.HadronTooltip', HadronTooltip);

    this.CollectionsTable = require('../../src/internal-packages/database/lib/components/collections-table');
  });
  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.dataService = appDataService;
    app.instance = appInstance;
  });

  context('when collection is not writable', () => {
    beforeEach(() => {
      app.dataService = {
        isWritable: () => {
          return false;
        }
      };
      this.component = mount(<this.CollectionsTable columns={['Namespace']} />);
    });

    it('disables the CREATE COLLECTION button', () => {
      const state = this.component.find('.btn.btn-primary.btn-xs');
      expect(state).to.be.disabled();
    });
    it('shows tooltip indicating why button is disabled', () => {
      expect(this.component.find('.tooltip-button-wrapper'))
        .to.have.data('tip', 'This action is not available on a secondary node');
    });
  });

  context('when collection is writable', () => {
    beforeEach(() => {
      app.dataService = {
        isWritable: () => {
          return true;
        }
      };
      this.component = mount(<this.CollectionsTable columns={['Namespace']} />);
    });

    it('enables the CREATE COLLECTION button', () => {
      const state = this.component.find('.btn.btn-primary.btn-xs');
      expect(state).to.not.be.disabled();
    });
  });
});
