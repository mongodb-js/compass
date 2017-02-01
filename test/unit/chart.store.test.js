/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');
const sinon = require('sinon');

require('../../src/app/reflux-listen-to-external-store.js');
const { NamespaceStore } = require('hadron-reflux-store');
const {
  AGGREGATE_FUNCTION_ENUM,
  CHART_TYPE_ENUM,
  MARK_PROPERTY_ENUM,
  MEASUREMENT_ENUM
} = require('../../src/internal-packages/chart/lib/constants');
const ChartActions = require('../../src/internal-packages/chart/lib/actions');
const ChartStore = require('../../src/internal-packages/chart/lib/store');
const _ = require('lodash');

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
  beforeEach(function() {
    // this.store = new ChartStore();  // TODO: Reflux 6 / COMPASS-686
    this.store = ChartStore;
  });
  afterEach(function() {
    this.store._resetChart();
  });

  context('when calling the selectField action', function() {
    it('stores the encoding channel relationship', function(done) {
      const expected = {
        'x': {field: COUNTRY_SCHEMA_FIELD.path}
      };
      ChartActions.selectField(MARK_PROPERTY_ENUM.x, COUNTRY_SCHEMA_FIELD.path);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('throws error on receiving an unknown encoding property', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectField('FOO_BAR', COUNTRY_SCHEMA_FIELD.path);
      };
      expect(throwFn).to.throw(/Unknown encoding property: FOO_BAR/);
    });
  });

  context('when calling the selectMeasurement action', function() {
    it('stores the encoding channel relationship', function(done) {
      const expected = {
        'y': {measurement: 'quantitative'}
      };
      ChartActions.selectMeasurement(MARK_PROPERTY_ENUM.y, MEASUREMENT_ENUM.quantitative);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('throws error on receiving an unknown encoding property', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectMeasurement('FOO_BAR', MEASUREMENT_ENUM.quantitative);
      };
      expect(throwFn).to.throw(/Unknown encoding property: FOO_BAR/);
    });
    it('throws error on receiving an unknown encoding measurement', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectMeasurement(MARK_PROPERTY_ENUM.y, 'NOT_quantitative');
      };
      expect(throwFn).to.throw(/Unknown encoding measurement: NOT_quantitative/);
    });
  });

  context('when calling the selectAggregate action', function() {
    it('stores the encoding channel relationship', function(done) {
      const expected = {
        'size': {aggregate: 'count'}
      };
      ChartActions.selectAggregate(MARK_PROPERTY_ENUM.size, AGGREGATE_FUNCTION_ENUM.count);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('throws error on receiving an unknown encoding property', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectAggregate('FOO_BAR', AGGREGATE_FUNCTION_ENUM.count);
      };
      expect(throwFn).to.throw(/Unknown encoding property: FOO_BAR/);
    });
    it('throws error on receiving an unknown encoding aggregate', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.selectAggregate(MARK_PROPERTY_ENUM.size, 'NOT_quantitative');
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
      let chartKeys, initialChartState;
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
        })
      });

      it('the namespaceCache state is not flushed', function(done) {
        const POPULATED_CACHE = {namespaceCache: 'mongodb.fanclub'};
        const expected = Object.assign({}, this.store.getInitialCacheState(), POPULATED_CACHE);
        setTimeout(() => {
          const newCacheState = _.omit(this.store.state, chartKeys);
          expect(newCacheState).to.be.deep.equal(expected);
          done();
        })
      });
    });
  });

  context('when calling multiple actions', function() {
    it('encodes every action in channels state', function(done) {
      // Expect 3 keys set
      const expected = {
        'x': {field: COUNTRY_SCHEMA_FIELD.path},
        'y': {measurement: 'quantitative'},
        'size': {aggregate: 'count'}
      };

      // As we currently run 3 actions
      ChartActions.selectField(MARK_PROPERTY_ENUM.x, COUNTRY_SCHEMA_FIELD.path);
      ChartActions.selectMeasurement(MARK_PROPERTY_ENUM.y, MEASUREMENT_ENUM.quantitative);
      ChartActions.selectAggregate(MARK_PROPERTY_ENUM.size, AGGREGATE_FUNCTION_ENUM.count);

      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
  });
});
