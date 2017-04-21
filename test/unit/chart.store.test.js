/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');

require('../../src/app/reflux-listen-to-external-store.js');
const { NamespaceStore } = require('hadron-reflux-store');
const {
  AGGREGATE_FUNCTION_ENUM,
  CHART_CHANNEL_ENUM,
  CHART_TYPE_CHANNELS,
  CHART_TYPE_ENUM,
  MEASUREMENT_ENUM,
  DEFAULTS
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

const YEAR_SCHEMA_FIELD = {
  name: 'year',
  path: 'year',
  count: 100,
  type: 'Int32',
  probability: 1
};

const REVENUE_SCHEMA_FIELD = {
  name: 'revenue',
  path: 'revenue',
  count: 80,
  type: 'Decimal128',
  probability: 0.8
};

describe('ChartStore', function() {
  before(mockDataService.before());
  after(mockDataService.after());

  beforeEach(function() {
    // this.store = new ChartStore();  // TODO: Reflux 6 / COMPASS-686
    this.store = ChartStore;
    this.store.state.fieldsCache = {
      'address.country': COUNTRY_SCHEMA_FIELD,
      'year': YEAR_SCHEMA_FIELD,
      'revenue': REVENUE_SCHEMA_FIELD
    };
  });
  afterEach(function() {
    this.store._resetChart();
  });

  it('has the correct initial queryCache values', function() {
    this.store._resetChart();
    expect(this.store.state.queryCache).to.be.deep.equal({
      filter: {},
      sort: null,
      project: null,
      skip: 0,
      limit: 1000,
      maxTimeMS: 10000,
      ns: ''
    });
  });

  const initialFields = ['specType', 'chartType', 'channels'];

  context('when using the history', function() {
    it('only contains a single state initially', function() {
      const initialHistory = _.pick(this.store.getInitialChartState(), initialFields);
      expect(this.store.history).to.have.lengthOf(1);
      expect(_.omit(this.store.history[0], 'id')).to.have.all.keys(initialFields);
      expect(_.omit(this.store.history[0], 'id')).to.deep.equal(initialHistory);
    });

    it('adds a new state to the history when changing the spec', function(done) {
      expect(this.store.history).to.have.lengthOf(1);
      ChartActions.selectChartType(CHART_TYPE_ENUM.AREA);
      setTimeout(() => {
        expect(this.store.history).to.have.lengthOf(2);
        expect(this.store.history_position).to.be.equal(1);
        expect(this.store.history[1].chartType).to.be.equal(CHART_TYPE_ENUM.AREA);
        done();
      });
    });

    it('discards the rest of the redo states when executing a new action', function(done) {
      this.store._resetHistory();
      this.store.history = [{id: 0}, {id: 1}, {id: 2}, {id: 3}, {id: 4}];
      this.store.history_position = 4;
      this.store.history_counter = 4;
      ChartActions.undoAction();
      ChartActions.undoAction();
      ChartActions.undoAction();
      ChartActions.clearChart();
      setTimeout(() => {
        expect(this.store.history).to.have.lengthOf(3);
        expect(_.pluck(this.store.history, 'id')).to.be.deep.equal([0, 1, 5]);
        done();
      });
    });

    context('when the history is pre-populated', function() {
      beforeEach(function(done) {
        ChartActions.mapFieldToChannel('year', 'x');
        setTimeout(() => {
          const unsubscribe = this.store.listen(() => {
            expect(this.store.history).to.have.lengthOf(3);
            expect(this.store.history_position).to.be.equal(2);
            unsubscribe();
            done();
          });
          ChartActions.selectChartType(CHART_TYPE_ENUM.AREA);
        });
      });
      it('returns to the last state with undoAction', function(done) {
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(3);
          expect(this.store.history_position).to.be.equal(1);
          expect(this.store.state.chartType).to.be.equal(DEFAULTS.CHART_TYPE);
          expect(this.store.state.channels).to.have.all.keys('x');
          done();
        });
      });
      it('can go back multiple steps', function(done) {
        ChartActions.undoAction();
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(3);
          expect(this.store.history_position).to.be.equal(0);
          expect(this.store.state.chartType).to.be.equal(DEFAULTS.CHART_TYPE);
          expect(this.store.state.channels).to.be.deep.equal({});
          done();
        });
      });
      it('does not go back further than to the beginning of the history', function(done) {
        ChartActions.undoAction();
        ChartActions.undoAction();
        ChartActions.undoAction();
        ChartActions.undoAction();
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(3);
          expect(this.store.history_position).to.be.equal(0);
          expect(this.store.state.chartType).to.be.equal(DEFAULTS.CHART_TYPE);
          expect(this.store.state.channels).to.be.deep.equal({});
          done();
        });
      });
      it('moves forward when using redoAction', function(done) {
        ChartActions.undoAction();
        ChartActions.redoAction();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(3);
          expect(this.store.history_position).to.be.equal(2);
          expect(this.store.state.chartType).to.be.equal(CHART_TYPE_ENUM.AREA);
          expect(this.store.state.channels).to.have.all.keys('x');
          done();
        });
      });
      it('moves not further forward than to the end of the history', function(done) {
        ChartActions.undoAction();
        ChartActions.redoAction();
        ChartActions.redoAction();
        ChartActions.redoAction();
        ChartActions.redoAction();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(3);
          expect(this.store.history_position).to.be.equal(2);
          expect(this.store.state.chartType).to.be.equal(CHART_TYPE_ENUM.AREA);
          expect(this.store.state.channels).to.have.all.keys('x');
          done();
        });
      });
      it('pushes the cleared state to the history on clearChart', function(done) {
        const initialHistory = _.pick(this.store.getInitialChartState(), initialFields);
        ChartActions.clearChart();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(4);
          expect(this.store.history_position).to.be.equal(3);
          expect(this.store.state.chartType).to.be.equal(DEFAULTS.CHART_TYPE);
          expect(this.store.state.channels).to.be.deep.equal({});
          expect(_.omit(this.store.history[3], 'id')).to.be.deep.equal(initialHistory);
          done();
        });
      });
      it('does not modify previous history objects when encoding a channel', function(done) {
        expect(this.store.history).to.have.lengthOf(3);
        expect(this.store.history[2].channels).to.have.all.keys('x');
        ChartActions.mapFieldToChannel('revenue', 'y');
        ChartActions.undoAction();
        ChartActions.mapFieldToChannel('revenue', 'color');
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(4);
          expect(this.store.history[2].channels).to.have.all.keys('x');
          done();
        });
      });
    });

    context('hasUndoableActions and hasRedoableActions', function() {
      beforeEach(function(done) {
        ChartActions.selectChartType(CHART_TYPE_ENUM.AREA);
        ChartActions.selectChartType(CHART_TYPE_ENUM.LINE);
        ChartActions.selectChartType(CHART_TYPE_ENUM.BAR);
        setTimeout(() => {
          const unsubscribe = this.store.listen(() => {
            expect(this.store.history).to.have.lengthOf(5);
            expect(this.store.history_position).to.be.equal(4);
            unsubscribe();
            done();
          });
        });
        ChartActions.selectChartType(CHART_TYPE_ENUM.POINT);
      });

      it('sets hasUndoableActions to true if there are undoable actions', function(done) {
        ChartActions.undoAction();
        ChartActions.undoAction();
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.state.hasUndoableActions).to.be.true;
          done();
        });
      });
      it('sets hasUndoableActions to false if there are no undoable actions', function(done) {
        ChartActions.undoAction();
        ChartActions.undoAction();
        ChartActions.undoAction();
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.state.hasUndoableActions).to.be.false;
          done();
        });
      });
      it('sets hasRedoableActions to true if there are redoable actions', function(done) {
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.state.hasRedoableActions).to.be.true;
          done();
        });
      });
      it('sets hasRedoableActions to false if there are no redoable actions', function(done) {
        setTimeout(() => {
          expect(this.store.state.hasRedoableActions).to.be.false;
          done();
        });
      });
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
        'x': {field: COUNTRY_SCHEMA_FIELD.path, type: MEASUREMENT_ENUM.NOMINAL}
      };
      ChartActions.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, CHART_CHANNEL_ENUM.X);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('stores a detail encoding channel relationship', function(done) {
      const expected = {
        'detail': {field: COUNTRY_SCHEMA_FIELD.path, type: MEASUREMENT_ENUM.NOMINAL}
      };
      ChartActions.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, CHART_CHANNEL_ENUM.DETAIL);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('throws error on receiving an unknown encoding channel', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, 'FOO_BAR');
      };
      expect(throwFn).to.throw(/Unknown encoding channel: FOO_BAR/);
    });
    it('throws error on receiving an unknown field', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.mapFieldToChannel('foo.bar', CHART_CHANNEL_ENUM.X);
      };
      expect(throwFn).to.throw(/Unknown field: foo.bar/);
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
        'x': {field: COUNTRY_SCHEMA_FIELD.path, type: 'nominal'},
        'y': {type: 'quantitative'},
        'size': {aggregate: 'count'}
      };

      // As we currently run 3 actions
      ChartActions.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, CHART_CHANNEL_ENUM.X);
      ChartActions.selectMeasurement(CHART_CHANNEL_ENUM.Y, MEASUREMENT_ENUM.QUANTITATIVE);
      ChartActions.selectAggregate(CHART_CHANNEL_ENUM.SIZE, AGGREGATE_FUNCTION_ENUM.COUNT);

      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
  });

  context('when infering measurement types', function() {
    it('maps single type fields to its correct measurement', function() {
      const infer = this.store._inferMeasurementFromField;
      expect(infer({type: 'Double'})).to.be.equal(MEASUREMENT_ENUM.QUANTITATIVE);
      expect(infer({type: 'Int32'})).to.be.equal(MEASUREMENT_ENUM.QUANTITATIVE);
      expect(infer({type: 'Long'})).to.be.equal(MEASUREMENT_ENUM.QUANTITATIVE);
      expect(infer({type: 'Decimal128'})).to.be.equal(MEASUREMENT_ENUM.QUANTITATIVE);
      expect(infer({type: 'Date'})).to.be.equal(MEASUREMENT_ENUM.TEMPORAL);
      expect(infer({type: 'ObjectId'})).to.be.equal(MEASUREMENT_ENUM.TEMPORAL);
      expect(infer({type: 'Timestamp'})).to.be.equal(MEASUREMENT_ENUM.TEMPORAL);
      expect(infer({type: 'Binary'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'Boolean'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'Code'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'DBRef'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'MaxKey'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'MinKey'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'Null'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'RegExp'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'String'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: 'Symbol'})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
    });
    it('maps multi-type fields to its lowest common measurement type', function() {
      const infer = this.store._inferMeasurementFromField;
      expect(infer({type: ['Double', 'String']})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: ['Double', 'Decimal128']})).to.be.equal(MEASUREMENT_ENUM.QUANTITATIVE);
      expect(infer({type: ['Date', 'Int32']})).to.be.equal(MEASUREMENT_ENUM.QUANTITATIVE);
      expect(infer({type: ['Date', 'ObjectId']})).to.be.equal(MEASUREMENT_ENUM.TEMPORAL);
      expect(infer({type: ['Code', 'ObjectId']})).to.be.equal(MEASUREMENT_ENUM.NOMINAL);
      expect(infer({type: ['Code', 'Boolean', 'DBRef', 'Timestamp']}))
        .to.be.equal(MEASUREMENT_ENUM.NOMINAL);
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

  context('when calling _updateSpec', () => {
    beforeEach(() => {
      ChartStore.setState({dataCache: [
        {revenue: 1, year: 1},
        {revenue: 2, year: 2},
        {revenue: 4, year: 3},
        {revenue: 3, year: 4},
        {revenue: 5, year: 5}
      ]});
      ChartStore.mapFieldToChannel('year', CHART_CHANNEL_ENUM.X);
      ChartStore.mapFieldToChannel('revenue', CHART_CHANNEL_ENUM.Y);
      ChartStore.selectMeasurement(CHART_CHANNEL_ENUM.X, MEASUREMENT_ENUM.QUANTITATIVE);
      ChartStore.selectMeasurement(CHART_CHANNEL_ENUM.Y, MEASUREMENT_ENUM.QUANTITATIVE);
    });
    it('the spec contains the top level keys mark and encoding', () => {
      ChartStore._updateSpec({});
      expect(ChartStore.state.spec).to.include.all.keys('mark', 'encoding');
      // Can also copy/paste the JSON.stringify() of this into
      //    https://vega.github.io/vega-editor/?mode=vega-lite
      // For example:
      //    console.log(JSON.stringify(spec));
    });
    it('the spec is only valid when all required fields are encoded', () => {
      ChartStore._resetChart();
      expect(ChartStore.state.specValid).to.be.false;
      ChartStore._updateSpec({
        channels: {
          x: {field: 'address.country', type: 'nominal'},
          y: {field: 'revenue', type: 'quantitative'}
        }
      });
      expect(ChartStore.state.specValid).to.be.true;
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

    context('when calling with limit > 1000', () => {
      it('limits the limit to 1000', () => {
        ChartStore._refreshDataCache(Object.assign({}, defaultQuery, {
          ns: 'foo.bar',
          limit: 5000
        }));
        const findOptions = app.dataService.find.args[0][2];
        expect(findOptions.limit).to.be.equal(1000); // @todo temporary limitation
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
