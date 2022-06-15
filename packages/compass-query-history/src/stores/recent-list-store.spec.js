import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';

import configureStore from '../../src/stores/recent-list-store';

describe('RecentListStore [Store]', function() {
  let store;
  let appRegistry;

  beforeEach(function() {
    appRegistry = new AppRegistry();
    store = configureStore({ localAppRegistry: appRegistry });
  });

  describe('#init', function() {
    it('initializes with the recent list', function() {
      expect(store.state.items.length).to.equal(0);
    });
  });

  describe('#emit query-applied', function() {
    context('when the filter is blank', function() {
      beforeEach(function() {
        appRegistry.emit('query-applied', { ns: 'test.test', filter: {}});
      });

      it('does not add the query to the list', function() {
        expect(store.state.items.length).to.equal(0);
      });
    });

    context('when the project is blank', function() {
      beforeEach(function() {
        appRegistry.emit('query-applied', { ns: 'test.test', project: {}});
      });

      it('does not add the query to the list', function() {
        expect(store.state.items.length).to.equal(0);
      });
    });

    context('when the sort is blank', function() {
      beforeEach(function() {
        appRegistry.emit('query-applied', { ns: 'test.test', sort: {}});
      });

      it('does not add the query to the list', function() {
        expect(store.state.items.length).to.equal(0);
      });
    });

    context('when the ns is blank', function() {
      beforeEach(function() {
        appRegistry.emit('query-applied', { filter: { name: 'test' }});
      });

      it('does not add the query to the list', function() {
        expect(store.state.items.length).to.equal(0);
      });
    });

    context('when the attributes are not blank', function() {
      beforeEach(function() {
        appRegistry.emit('query-applied', { ns: 'test.test', filter: { name: 'test' }});
      });

      afterEach(function() {
        store.state.items.reset();
      });

      it('adds the query to the list', function() {
        expect(store.state.items.length).to.equal(1);
      });
    });

    context('when a collation is present', function() {
      beforeEach(function() {
        appRegistry.emit('query-applied', { ns: 'test.test', collation: { locale: 'en' }});
      });

      afterEach(function() {
        store.state.items.reset();
      });

      it('adds the query to the list', function() {
        expect(store.state.items.length).to.equal(1);
      });

      it('stores the collation', function() {
        expect(store.state.items.at(0).collation).to.deep.equal({ locale: 'en' });
      });
    });
  });

  // TODO: this writes files to the current folder
  describe.skip('#addRecent', function() {
    it('ignores duplicate queries', function() {
      expect(store.state.items.length).to.equal(0);

      const recent = { ns: 'foo', filter: { foo: 1 } };

      store.addRecent(recent);
      expect(store.state.items.length).to.equal(1);

      // set _lastExecuted to the epoch so we can check that it gets increased
      store.state.items.at(0)._lastExecuted = 0;
      store.state.items.at(0).save();
      expect(store.state.items.at(0)._lastExecuted.getTime()).to.equal(0);

      store.addRecent(recent);
      expect(store.state.items.length).to.equal(1);

      // didn't add a duplicate, but did move it to the top
      expect(store.state.items.at(0)._lastExecuted.getTime()).to.be.gt(0);
    });
  });
});
