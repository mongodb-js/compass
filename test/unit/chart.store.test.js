/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');

require('../../src/app/reflux-listen-to-external-store.js');
const { NamespaceStore } = require('hadron-reflux-store');
const {
  AGGREGATE_FUNCTION_ENUM,
  CHART_CHANNEL_ENUM,
  CHART_TYPE_CHANNELS,
  CHART_TYPE_ENUM,
  MEASUREMENT_ENUM
} = require('../../src/internal-packages/chart/lib/constants');
const ChartActions = require('../../src/internal-packages/chart/lib/actions');
const ChartStore = require('../../src/internal-packages/chart/lib/store');
const _ = require('lodash');
const app = require('hadron-app');

const mockDataService = require('./support/mock-data-service');

/**
 * Country sub-field of address,
 * extracted from the MongoDB fanclub example.
 *
 * @see https://github.com/mongodb-js/mongodb-schema
 */
const COUNTRY_SCHEMA_FIELD = {
  name: 'country',
  path: 'address.country',
  count: 100,
  type: 'String',
  probability: 1
};

describe('ChartStore', function() {
  before(mockDataService.before());
  after(mockDataService.after());

  beforeEach(function() {
    // this.store = new ChartStore();  // TODO: Reflux 6 / COMPASS-686
    this.store = ChartStore;
  });
  afterEach(function() {
    this.store._resetChart();
  });

  it('has the correct initial queryCache values', function() {
    expect(this.store.state.queryCache).to.be.deep.equal({
      filter: {},
      sort: null,
      project: null,
      skip: 0,
      limit: 100,
      maxTimeMS: 10000,
      ns: ''
    });
  });

  context('when the query changes', function() {
    it('contains the new query in the queryCache', function(done) {
      const QUERY = {
        filter: {foo: 1},
        project: null,
        sort: {_id: 1},
        skip: 13,
        limit: 5,
        maxTimeMS: 10000,
        ns: 'test.collection'
      };

      const unsubscribe = this.store.listen((state) => {
        expect(state.queryCache).to.be.deep.equal(QUERY);
        unsubscribe();
        done();
      });

      this.store.onQueryChanged(QUERY);
    });
  });

  context('when calling the mapFieldToChannel action', function() {
    it('stores a mark property encoding channel relationship', function(done) {
      const expected = {
        'x': {field: COUNTRY_SCHEMA_FIELD.path}
      };
      ChartActions.mapFieldToChannel(CHART_CHANNEL_ENUM.X, COUNTRY_SCHEMA_FIELD.path);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('stores a detail encoding channel relationship', function(done) {
      const expected = {
        'detail': {field: COUNTRY_SCHEMA_FIELD.path}
      };
      ChartActions.mapFieldToChannel(CHART_CHANNEL_ENUM.DETAIL, COUNTRY_SCHEMA_FIELD.path);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('throws error on receiving an unknown encoding channel', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.mapFieldToChannel('FOO_BAR', COUNTRY_SCHEMA_FIELD.path);
      };
      expect(throwFn).to.throw(/Unknown encoding channel: FOO_BAR/);
    });
  });

  context('when calling the selectMeasurement action', function() {
    it('stores the encoding channel relationship', function(done) {
      const expected = {
        'y': {type: 'quantitative'}
      };
      ChartActions.selectMeasurement(CHART_CHANNEL_ENUM.Y, MEASUREMENT_ENUM.QUANTITATIVE);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('throws error on receiving an unknown encoding channel', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectMeasurement('FOO_BAR', MEASUREMENT_ENUM.QUANTITATIVE);
      };
      expect(throwFn).to.throw(/Unknown encoding channel: FOO_BAR/);
    });
    it('throws error on receiving an unknown encoding measurement', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectMeasurement(CHART_CHANNEL_ENUM.Y, 'NOT_quantitative');
      };
      expect(throwFn).to.throw(/Unknown encoding measurement: NOT_quantitative/);
    });
  });

  context('when calling the selectAggregate action', function() {
    it('stores the encoding channel relationship', function(done) {
      const expected = {
        'size': {aggregate: 'count'}
      };
      ChartActions.selectAggregate(CHART_CHANNEL_ENUM.SIZE, AGGREGATE_FUNCTION_ENUM.COUNT);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('throws error on receiving an unknown encoding channel', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectAggregate('FOO_BAR', AGGREGATE_FUNCTION_ENUM.COUNT);
      };
      expect(throwFn).to.throw(/Unknown encoding channel: FOO_BAR/);
    });
    it('throws error on receiving an unknown encoding aggregate', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectAggregate(CHART_CHANNEL_ENUM.SIZE, 'NOT_quantitative');
      };
      expect(throwFn).to.throw(/Unknown encoding aggregate: NOT_quantitative/);
    });
  });

  context('when calling the selectChartType action', function() {
    it('stores the chart type', function(done) {
      const chartType = CHART_TYPE_ENUM.AREA;
      ChartActions.selectChartType(chartType);
      setTimeout(() => {
        expect(this.store.state.chartType).to.be.equal(chartType);
        done();
      });
    });
    it('throws error on receiving an unknown chart type', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectChartType('foo-bar-baz-chart');
      };
      expect(throwFn).to.throw(/Unknown chart type: foo-bar-baz-chart/);
    });

    context('when calling the clearChart action after populating the namespaceCache', function() {
      let chartKeys;
      let initialChartState;
      beforeEach(function() {
        initialChartState = this.store.getInitialChartState();
        chartKeys = Object.keys(initialChartState);

        // Handle side-effect in ValidationStore or other tests trigger a:
        // "TypeError: Cannot read property 'call' of undefined"
        const ValidationStore = require('../../src/internal-packages/validation/lib/stores');
        ValidationStore._fetchFromServer = function(callback) {
          return callback(null, null);
        };

        // Set up a namespace change so the namespaceCache has been modified
        NamespaceStore.ns = 'mongodb.fanclub';
        ChartActions.selectChartType(CHART_TYPE_ENUM.AREA);

        // Action under test
        ChartActions.clearChart();
      });
      afterEach(() => {
        NamespaceStore.ns = '';
      });

      it('updates to the initial chart state', function(done) {
        setTimeout(() => {
          const newChartState = _.pick(this.store.state, chartKeys);
          expect(newChartState).to.be.deep.equal(initialChartState);
          done();
        });
      });
    });
  });

  context('when calling multiple actions', function() {
    it('encodes every action in channels state', function(done) {
      // Expect 3 keys set
      const expected = {
        'x': {field: COUNTRY_SCHEMA_FIELD.path},
        'y': {type: 'quantitative'},
        'size': {aggregate: 'count'}
      };

      // As we currently run 3 actions
      ChartActions.mapFieldToChannel(CHART_CHANNEL_ENUM.X, COUNTRY_SCHEMA_FIELD.path);
      ChartActions.selectMeasurement(CHART_CHANNEL_ENUM.Y, MEASUREMENT_ENUM.QUANTITATIVE);
      ChartActions.selectAggregate(CHART_CHANNEL_ENUM.SIZE, AGGREGATE_FUNCTION_ENUM.COUNT);

      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
  });

  context('with the CHART_TYPE_CHANNELS', () => {
    it('defines all top-level keys from CHART_TYPE_ENUM', () => {
      Object.keys(CHART_TYPE_CHANNELS).forEach((value) => {
        expect(value).to.be.oneOf(_.values(CHART_TYPE_ENUM));
      });
    });
    it('defines all second-level keys from CHART_CHANNEL_ENUM', () => {
      for (const channelValue of _.values(CHART_TYPE_CHANNELS)) {
        Object.keys(channelValue).forEach((value) => {
          expect(value).to.be.oneOf(_.values(CHART_CHANNEL_ENUM));
        });
      }
    });
    it('defines all second-level values as required or optional', () => {
      for (const channelValue of _.values(CHART_TYPE_CHANNELS)) {
        for (const requiredValue of _.values(channelValue)) {
          expect(requiredValue).to.be.oneOf(['required', 'optional']);
        }
      }
    });
  });

  context('when calling getVegaLiteSpec', () => {
    beforeEach(() => {
      ChartStore.setState({dataCache: [
        {revenue: 1, year: 1},
        {revenue: 2, year: 2},
        {revenue: 4, year: 3},
        {revenue: 3, year: 4},
        {revenue: 5, year: 5}
      ]});
      ChartStore.mapFieldToChannel(CHART_CHANNEL_ENUM.X, 'year');
      ChartStore.mapFieldToChannel(CHART_CHANNEL_ENUM.Y, 'revenue');
      ChartStore.selectMeasurement(CHART_CHANNEL_ENUM.X, MEASUREMENT_ENUM.QUANTITATIVE);
      ChartStore.selectMeasurement(CHART_CHANNEL_ENUM.Y, MEASUREMENT_ENUM.QUANTITATIVE);
    });
    it('the spec contains the top level keys data, mark and encoding', () => {
      const spec = ChartStore.getVegaLiteSpec();
      expect(spec).to.have.all.keys('data', 'mark', 'encoding');
      // Can also copy/paste the JSON.stringify() of this into
      //    https://vega.github.io/vega-editor/?mode=vega-lite
      // For example:
      //    console.log(JSON.stringify(spec));
    });
  });

  context('when calling _refreshDataCache', () => {
    const defaultQuery = {
      filter: {},
      sort: null,
      project: null,
      skip: 0,
      limit: 100,
      ns: '',
      maxTimeMS: 10000
    };

    beforeEach(mockDataService.before());
    afterEach(mockDataService.after());

    context('when calling with default arguments', () => {
      it('calls app.dataService.find with the correct arguments', () => {
        ChartStore.state.queryCache.ns = 'foo.bar';
        ChartStore._refreshDataCache(Object.assign({}, defaultQuery, {
          ns: 'foo.bar'
        }));
        const findOptions = app.dataService.find.args[0][2];
        const filter = app.dataService.find.args[0][1];
        const ns = app.dataService.find.args[0][0];

        expect(ns).to.be.equal('foo.bar');
        expect(filter).to.be.deep.equal({});
        expect(findOptions.sort).to.be.null;
        expect(findOptions.fields).to.be.null;
        expect(findOptions.skip).to.be.equal(0);
        expect(findOptions.limit).to.be.equal(100); // @todo temporary limitation
      });
    });
    context('when calling with limit > 100', () => {
      it('limits the limit to 100', () => {
        ChartStore._refreshDataCache(Object.assign({}, defaultQuery, {
          ns: 'foo.bar',
          limit: 5000
        }));
        const findOptions = app.dataService.find.args[0][2];
        expect(findOptions.limit).to.be.equal(100); // @todo temporary limitation
      });
    });
    context('when using non-default query options', () => {
      const nonDefaultQuery = Object.assign({}, defaultQuery, {
        ns: 'foo.bar',
        filter: {foo: true},
        project: {bar: 1},
        sort: {baz: 1},
        skip: 40,
        limit: 9
      });
      it('calls app.dataService.find with the correct arguments', () => {
        ChartStore._refreshDataCache(nonDefaultQuery);
        const findOptions = app.dataService.find.args[0][2];
        const filter = app.dataService.find.args[0][1];
        const ns = app.dataService.find.args[0][0];

        expect(ns).to.be.equal('foo.bar');
        expect(filter).to.be.deep.equal({foo: true});
        expect(findOptions.fields).to.be.deep.equal({bar: 1});
        expect(findOptions.sort).to.deep.equal([['baz', 1]]);
        expect(findOptions.skip).to.be.equal(40);
        expect(findOptions.limit).to.be.equal(9);
      });
      it('updates the queryCache', (done) => {
        const unsubscribe = ChartStore.listen((state) => {
          expect(state.queryCache).to.be.deep.equal(nonDefaultQuery);
          unsubscribe();
          done();
        });
        ChartStore._refreshDataCache(nonDefaultQuery);
      });
    });
  });
});
