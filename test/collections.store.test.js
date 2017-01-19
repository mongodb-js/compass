/* eslint no-unused-expressions: 0 */
const { expect } = require('chai');
const app = require('ampersand-app');

require('../src/app/reflux-listen-to-external-store.js');

const CollectionsStore = require('../src/internal-packages/database/lib/stores/collections-store');
const InstanceStore = require('../src/internal-packages/app/lib/stores/instance-store');
const { NamespaceStore } = require('hadron-reflux-store');

describe('CollectionsStore', () => {
  const appDataService = app.dataService;
  const appInstance = app.instance;
  const MOCK_APP_DATA_SERVICE = {
    database: (namespace, {}, callback) => {
      callback(null, {collections: []});
    }
  };
  const MOCK_APP_INSTANCE = {databases: ['foo-database']};

  beforeEach(() => {
    // Stub out the app.instance so the NamespaceStore.ns setup runs through
    app.instance = MOCK_APP_INSTANCE;
    app.dataService = MOCK_APP_DATA_SERVICE;
    NamespaceStore.ns = 'foo-database';
  });

  afterEach(() => {
    CollectionsStore.setState(CollectionsStore.getInitialState());
    app.dataService = appDataService;
    app.instance = appInstance;
  });

  it('onInstanceChange with no databases renders an empty list', (done) => {
    const state = InstanceStore.getInitialState();
    expect(state.instance.databases.length).to.be.equal(0);

    CollectionsStore.onInstanceChange(state);
    setTimeout(() => {
      expect(CollectionsStore.state.collections.length).to.be.equal(0);
      done();
    }, 1);
  });
});
