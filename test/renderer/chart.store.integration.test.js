/* eslint no-unused-expressions: 0 */
const app = require('ampersand-app');
const { expect } = require('chai');

// HACK: Work around
// TypeError: Cannot read property 'indexOf' of undefined
const { NamespaceStore } = require('hadron-reflux-store');
NamespaceStore.ns = '';
// End HACK, drop it if you can keep the renderer tests passing :)

describe('ChartStoreIntegration', function() {
  beforeEach(function() {
    this.ChartStore = app.appRegistry.getStore('Chart.Store');
    this.QueryStore = app.appRegistry.getStore('Query.Store');
  });
  afterEach(function() {
    this.ChartStore._resetChart();
    this.QueryStore.reset();
  });

  context('queryCache', function() {
    it('initial state is an empty object', function(done) {
      setTimeout(() => {
        const queryCache = this.ChartStore.state.queryCache;
        expect(queryCache).to.be.deep.equal({});
        done();
      });
    });

    it('after clicking apply the queryCache is populated', function(done) {
      const QUERY = {filter: {foo: 1}};
      const EXPECTED = Object.assign({}, {
        project: null,
        sort: {_id: 1},
        skip: 0,
        limit: 0,
        maxTimeMS: 10000,
        queryState: 'apply'
      }, QUERY);

      this.QueryStore.setQuery(QUERY);
      this.QueryStore.apply();

      setTimeout(() => {
        const queryCache = this.ChartStore.state.queryCache;
        expect(queryCache).to.be.deep.equal(EXPECTED);
        done();
      });
    });

    it('after clicking apply then reset the queryCache is an empty object', function(done) {
      this.QueryStore.setQuery({filter: {foo: 1}});
      this.QueryStore.apply();
      this.QueryStore.reset();

      setTimeout(() => {
        const queryCache = this.ChartStore.state.queryCache;
        expect(queryCache).to.be.deep.equal({});
        done();
      });
    });
  });
});
