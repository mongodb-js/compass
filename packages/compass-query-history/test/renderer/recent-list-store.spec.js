import { RecentListStore } from 'stores';
import AppRegistry from 'hadron-app-registry';

describe('RecentListStore [Store]', () => {
  const appRegistry = new AppRegistry();

  before(() => {
    appRegistry.registerStore('RecentListStore', RecentListStore);
    appRegistry.onActivated();
  });

  describe('#init', () => {
    it('initializes with the recent list', () => {
      expect(RecentListStore.state.items.length).to.equal(0);
    });
  });

  describe('#emit query-applied', () => {
    context('when the filter is blank', () => {
      before(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', filter: {}});
      });

      it('does not add the query to the list', () => {
        expect(RecentListStore.state.items.length).to.equal(0);
      });
    });

    context('when the project is blank', () => {
      before(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', project: {}});
      });

      it('does not add the query to the list', () => {
        expect(RecentListStore.state.items.length).to.equal(0);
      });
    });

    context('when the sort is blank', () => {
      before(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', sort: {}});
      });

      it('does not add the query to the list', () => {
        expect(RecentListStore.state.items.length).to.equal(0);
      });
    });

    context('when the ns is blank', () => {
      before(() => {
        appRegistry.emit('query-applied', { filter: { name: 'test' }});
      });

      it('does not add the query to the list', () => {
        expect(RecentListStore.state.items.length).to.equal(0);
      });
    });

    context('when the attributes are not blank', () => {
      before(() => {
        appRegistry.emit('query-applied', { ns: 'test.test', filter: { name: 'test' }});
      });

      after(() => {
        RecentListStore.state.items.reset();
      });

      it('adds the query to the list', () => {
        expect(RecentListStore.state.items.length).to.equal(1);
      });
    });
  });
});
