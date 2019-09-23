import configureStore from '../../src/stores/recent-list-store';
import AppRegistry from 'hadron-app-registry';

describe('RecentListStore [Store]', () => {
  let store;
  let appRegistry;

  beforeEach(() => {
    appRegistry = new AppRegistry();
    store = configureStore({ localAppRegistry: appRegistry });
  });

  describe('#init', () => {
    it('initializes with the recent list', () => {
      expect(store.state.items.length).to.equal(0);
    });
  });

  describe('#emit query-applied', () => {
    context('when the filter is blank', () => {
      beforeEach(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', filter: {}});
      });

      it('does not add the query to the list', () => {
        expect(store.state.items.length).to.equal(0);
      });
    });

    context('when the project is blank', () => {
      beforeEach(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', project: {}});
      });

      it('does not add the query to the list', () => {
        expect(store.state.items.length).to.equal(0);
      });
    });

    context('when the sort is blank', () => {
      beforeEach(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', sort: {}});
      });

      it('does not add the query to the list', () => {
        expect(store.state.items.length).to.equal(0);
      });
    });

    context('when the ns is blank', () => {
      beforeEach(() => {
        appRegistry.emit('query-applied', { filter: { name: 'test' }});
      });

      it('does not add the query to the list', () => {
        expect(store.state.items.length).to.equal(0);
      });
    });

    context('when the attributes are not blank', () => {
      beforeEach(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', filter: { name: 'test' }});
      });

      afterEach(() => {
        store.state.items.reset();
      });

      it('adds the query to the list', () => {
        expect(store.state.items.length).to.equal(1);
      });
    });

    context('when a collation is present', () => {
      beforeEach(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', collation: { locale: 'en' }});
      });

      afterEach(() => {
        store.state.items.reset();
      });

      it('adds the query to the list', () => {
        expect(store.state.items.length).to.equal(1);
      });

      it('stores the collation', () => {
        expect(store.state.items.at(0).collation).to.deep.equal({ locale: 'en' });
      });
    });
  });
});
