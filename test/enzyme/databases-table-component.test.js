/* eslint no-unused-vars: 0, no-unused-expressions: 0 */
const app = require('hadron-app');
const chai = require('chai');
const chaiEnzyme = require('chai-enzyme');
const expect = chai.expect;
const React = require('react');
const sinon = require('sinon');
const {mount, shallow} = require('enzyme');
const AppRegistry = require('hadron-app-registry');
const { LOADING_STATE } = require('../../src/internal-packages/database/lib/constants');
const CreateCollectionCheckbox = require('../../src/internal-packages/database/lib/components/create-collection-checkbox');
const CreateCollectionInput = require('../../src/internal-packages/database/lib/components/create-collection-input');
const CreateCollectionSizeInput = require('../../src/internal-packages/database/lib/components/create-collection-size-input');
const { SortableTable } = require('hadron-react-components');

// use chai-enzyme assertions, see https://github.com/producthunt/chai-enzyme
chai.use(chaiEnzyme());

describe('<DatabasesTable />', () => {
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

    app.appRegistry.registerComponent('Schema.Schema', sinon.spy());
    app.appRegistry.registerComponent('CRUD.DocumentList', sinon.spy());
    app.appRegistry.registerComponent('Indexes.Indexes', sinon.spy());
    app.appRegistry.registerComponent('Explain.ExplainPlan', sinon.spy());
    app.appRegistry.registerComponent('Validation.Validation', sinon.spy());
    app.appRegistry.registerStore('DeploymentAwareness.WriteStateStore', stateStore);

    // Fixes Warning: React.createElement:
    // type should not be null, undefined, boolean, or number.
    // It should be a string (for DOM elements)
    // or a ReactClass (for composite components).
    app.appRegistry.registerComponent('CollectionStats.CollectionStats', sinon.spy());

    // TypeError: Cannot read property 'refreshInstance' of undefined
    //   at Store.init (src/internal-packages/server-stats/lib/stores/create-database-store.js:14:28)
    app.appRegistry.registerAction('App.InstanceActions', sinon.spy());

    //  1) <DatabasesTable /> when databases and dataService is writable it
    // "before each" hook for "does not render any message":
    //     Invariant Violation: Element type is invalid: expected a string
    // (for built-in components) or a class/function (for composite components)
    // but got: undefined. Check the render method of `DatabasesTable`.
    app.appRegistry.registerComponent('App.SortableTable', SortableTable);

    // Warning: React.createElement: type should not be null, undefined,
    // boolean, or number. It should be a string (for DOM elements) or
    // a ReactClass (for composite components).
    // Check the render method of `CreateDatabaseDialog`.
    app.appRegistry.registerComponent('Database.CreateCollectionCheckbox', CreateCollectionCheckbox);
    app.appRegistry.registerComponent('Database.CreateCollectionInput', CreateCollectionInput);
    app.appRegistry.registerComponent('Database.CreateCollectionSizeInput', CreateCollectionSizeInput);

    this.DatabasesTable = require('../../src/internal-packages/database-ddl/lib/component/databases-table');
  });
  afterEach(() => {
    // Restore properties on the global app object,
    // so they don't affect other tests
    app.appRegistry = appRegistry;
    app.dataService = appDataService;
    app.instance = appInstance;
  });

  context('when no databases and is not writable', () => {
    beforeEach(() => {
      stateStore.state.isWritable = false;
    });

    it('has a message containing connect to another instance', () => {
      const expected = 'The MongoDB instance you are connected to does not ' +
          // Note: Apparent typos are correct, spacing is handled by CSS
          'contain any collections, or you arenot authorizedto view them.' +
          'Connect to another instance';
      const component = shallow(<this.DatabasesTable
          columns={[]}
          databases={[]}
      />);
      const state = component.find('.no-collections-zero-state');
      expect(state.text()).to.be.equal(expected);
    });
  });

  context('when loading databases and is not writable', () => {
    beforeEach(() => {
      stateStore.state.isWritable = false;
    });

    // TODO: Need a non-global status component
    it.skip('displays a loading message', () => {
      const expected = 'Loading databases';
      const component = shallow(<this.DatabasesTable
          columns={[]}
          databases={LOADING_STATE}
      />);
      expect(component.text()).to.be.equal(expected);
    });
  });

  context('when no databases and is writable', () => {
    beforeEach(() => {
      stateStore.state.isWritable = true;
    });

    it('has only the not authorized message', () => {
      const expected = 'The MongoDB instance you are connected to does not ' +
          // Note: Apparent typos are correct, spacing is handled by CSS
          'contain any collections, or you arenot authorizedto view them.';
      const component = shallow(<this.DatabasesTable
          columns={[]}
          databases={[]}
      />);
      const state = component.find('.no-collections-zero-state');
      expect(state.text()).to.be.equal(expected);
    });
  });

  context('when databases exist and dataService is not writable', () => {
    beforeEach(() => {
      stateStore.state.isWritable = false;
      stateStore.state.description = 'not writable';
      this.component = mount(<this.DatabasesTable
        columns={['Namespace']}
        databases={[
          {Namespace: 'Foo'},
          {Namespace: 'Bar'},
          {Namespace: 'Baz'}
        ]} />);
    });

    it('disables the CREATE DATABASE button', () => {
      const state = this.component.find('.btn.btn-primary.btn-xs');
      expect(state).to.be.disabled();
    });

    it('shows tooltip indicating why button is disabled', () => {
      expect(this.component.find('.tooltip-button-wrapper'))
        .to.have.data('tip', 'not writable');
    });
  });

  context('when databases exist and dataService is writable', () => {
    beforeEach(() => {
      stateStore.state.isWritable = true;
      this.component = mount(<this.DatabasesTable
        columns={['Namespace']}
        databases={[
          {Namespace: 'Foo'},
          {Namespace: 'Bar'},
          {Namespace: 'Baz'}
        ]} />);
    });

    it('does not render any message', () => {
      const state = this.component.find('.no-collections-zero-state');
      expect(state.length).to.be.equal(0);
    });

    it('renders the databases', () => {
      const state = this.component.find(SortableTable);
      expect(state.text()).to.be.equal('NamespaceFooBarBaz');
    });

    it('enables the CREATE DATABASE button', () => {
      const state = this.component.find('.btn.btn-primary.btn-xs');
      expect(state).to.not.be.disabled();
    });
  });
});
