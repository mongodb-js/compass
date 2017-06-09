/* eslint no-unused-expressions: 0 */

const { expect } = require('chai');

require('../../src/app/reflux-listen-to-external-store.js');
const NamespaceStore = require('../../src/internal-packages/app/lib/stores/namespace-store');
const {
  AGGREGATE_FUNCTION_ENUM,
  ARRAY_REDUCTION_TYPES,
  CHART_CHANNEL_ENUM,
  MEASUREMENT_ENUM,
  LITE_SPEC_GLOBAL_SETTINGS
} = require('../../src/internal-packages/chart/lib/constants');
const ChartActions = require('../../src/internal-packages/chart/lib/actions');
const ChartStore = require('../../src/internal-packages/chart/lib/store');
const _ = require('lodash');
const app = require('hadron-app');

const BarChartRole = require('../../src/internal-packages/chart/lib/chart-types/bar.json');
const AreaChartRole = require('../../src/internal-packages/chart/lib/chart-types/area.json');
const LineChartRole = require('../../src/internal-packages/chart/lib/chart-types/line.json');
const ScatterPlotRole = require('../../src/internal-packages/chart/lib/chart-types/scatter.json');

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
  type: 'String'
};

const YEAR_SCHEMA_FIELD = {
  name: 'year',
  path: 'year',
  type: 'Int32'
};

const REVENUE_SCHEMA_FIELD = {
  name: 'revenue',
  path: 'revenue',
  type: 'Decimal128'
};

// From the array_party dataset on COMPASS-1235
const UP_TO_5_TAGS_SCHEMA_FIELD = {
  name: 'up_to_5_tags',
  path: 'up_to_5_tags',
  type: 'Array'
};

describe('ChartStore', function() {
  before(mockDataService.before());
  after(mockDataService.after());

  beforeEach(function() {
    // this.store = new ChartStore();  // TODO: Reflux 6 / COMPASS-686
    this.store = ChartStore;

    this.store.AVAILABLE_CHART_ROLES = [ScatterPlotRole, BarChartRole,
      LineChartRole, AreaChartRole];
    this.store.INITIAL_CHART_TYPE = this.store.AVAILABLE_CHART_ROLES[0].name;
    this.store.INITIAL_SPEC_TYPE = this.store.AVAILABLE_CHART_ROLES[0].specType;
    this.store._setDefaults();

    this.store.state.fieldsCache = {
      'address.country': COUNTRY_SCHEMA_FIELD,
      'year': YEAR_SCHEMA_FIELD,
      'revenue': REVENUE_SCHEMA_FIELD,
      'up_to_5_tags': UP_TO_5_TAGS_SCHEMA_FIELD
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
      skip: 0,
      limit: 0,
      maxTimeMS: 10000,
      ns: ''
    });
  });

  context('when updating the spec manually via setSpecAsJSON', function() {
    it('fails silently when providing invalid JSON', function(done) {
      const retValue = this.store.setSpecAsJSON('{"I am": invalid JSON}');
      setTimeout(() => {
        expect(retValue).to.be.false;
        expect(this.store.state.spec).to.be.deep.equal(LITE_SPEC_GLOBAL_SETTINGS);
        done();
      });
    });
    it('fails when providing valid JSON but invalid spec', function(done) {
      const invalidSpec = '{"I am": "valid JSON", "but": "not valid vega-lite"}';
      const retValue = this.store.setSpecAsJSON(invalidSpec);
      setTimeout(() => {
        expect(retValue).to.be.false;
        expect(this.store.state.spec).to.be.deep.equal(LITE_SPEC_GLOBAL_SETTINGS);
        done();
      });
    });
    it('succeeds when providing valid JSON and valid spec', function(done) {
      const validSpecJSON = '{"mark": "point", "encoding": {"x": {"field": "year", "type": "temporal"}}}';
      const retValue = this.store.setSpecAsJSON(validSpecJSON);
      setTimeout(() => {
        expect(retValue).to.be.true;
        expect(this.store.state.spec).to.be.deep.equal(JSON.parse(validSpecJSON));
        done();
      });
    });
    it('keeps encoded channels even after switching back to chart builder view', function(done) {
      this.store.switchToJSONView();
      const spec = _.cloneDeep(this.store.state.spec);
      spec.mark = 'point';
      spec.encoding = {
        color: {
          field: 'year',
          type: 'nominal'
        }
      };
      const retValue = this.store.setSpecAsJSON(JSON.stringify(spec));
      this.store.switchToChartBuilderView();
      setTimeout(() => {
        expect(retValue).to.be.true;
        expect(this.store.state.channels).to.have.all.keys('color');
        expect(this.store.state.channels.color).to.have.all.keys('field', 'type');
        done();
      });
    });
  });

  const initialFields = ['specType', 'chartType', 'channels', 'reductions'];

  context('when using the history', function() {
    it('only contains a single state initially', function() {
      const initialHistory = _.pick(this.store.getInitialChartState(), initialFields);
      expect(this.store.history).to.have.lengthOf(1);
      expect(_.omit(this.store.history[0], 'id')).to.have.all.keys(initialFields);
      expect(_.omit(this.store.history[0], 'id')).to.deep.equal(initialHistory);
    });

    it('adds a new state to the history when changing the spec', function(done) {
      expect(this.store.history).to.have.lengthOf(1);
      ChartActions.selectChartType('Area Chart');
      setTimeout(() => {
        expect(this.store.history).to.have.lengthOf(2);
        expect(this.store.history_position).to.be.equal(1);
        expect(this.store.history[1].chartType).to.be.equal('Area Chart');
        done();
      });
    });

    it('does not push the same history state again', function(done) {
      expect(this.store.history).to.have.lengthOf(1);
      ChartActions.selectChartType('Area Chart');
      ChartActions.selectChartType('Area Chart');
      ChartActions.selectChartType('Area Chart');
      setTimeout(() => {
        expect(this.store.history).to.have.lengthOf(2);
        expect(this.store.history_position).to.be.equal(1);
        expect(this.store.history[1].chartType).to.be.equal('Area Chart');
        done();
      });
    });

    it('discards the rest of the redo states when executing a new action', function(done) {
      this.store._resetHistory();
      this.store.history = [
        {id: 0, chartType: 'Bar Chart'},
        {id: 1, chartType: 'Area Chart'},
        {id: 2, chartType: 'Bar Chart'},
        {id: 3, chartType: 'Area Chart'},
        {id: 4, chartType: 'Bar Chart'}
      ];
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
        ChartActions.selectChartType('Area Chart');
        setTimeout(() => {
          const unsubscribe = this.store.listen(() => {
            expect(this.store.history).to.have.lengthOf(3);
            expect(this.store.history_position).to.be.equal(2);
            unsubscribe();
            done();
          });
          ChartActions.mapFieldToChannel('year', 'x');
        });
      });
      it('returns to the last state with undoAction', function(done) {
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(3);
          expect(this.store.history_position).to.be.equal(1);
          expect(this.store.state.chartType).to.be.equal('Area Chart');
          expect(this.store.state.channels).to.be.empty;
          done();
        });
      });
      it('can go back multiple steps', function(done) {
        ChartActions.undoAction();
        ChartActions.undoAction();
        setTimeout(() => {
          expect(this.store.history).to.have.lengthOf(3);
          expect(this.store.history_position).to.be.equal(0);
          expect(this.store.state.chartType).to.be.equal(this.store.state.availableChartRoles[0].name);
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
          expect(this.store.state.chartType).to.be.equal(this.store.state.availableChartRoles[0].name);
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
          expect(this.store.state.chartType).to.be.equal('Area Chart');
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
          expect(this.store.state.chartType).to.be.equal('Area Chart');
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
          expect(this.store.state.chartType).to.be.equal(this.store.state.availableChartRoles[0].name);
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
        ChartActions.selectChartType('Area Chart');
        ChartActions.selectChartType('Line Chart');
        ChartActions.selectChartType('Bar Chart');
        setTimeout(() => {
          const unsubscribe = this.store.listen(() => {
            expect(this.store.history).to.have.lengthOf(5);
            expect(this.store.history_position).to.be.equal(4);
            unsubscribe();
            done();
          });
        });
        ChartActions.selectChartType('Scatter Plot');
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
        'x': {
          field: COUNTRY_SCHEMA_FIELD.path,
          type: MEASUREMENT_ENUM.NOMINAL
        }
      };
      ChartActions.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, CHART_CHANNEL_ENUM.X);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('stores a detail encoding channel relationship', function(done) {
      const expected = {
        'detail': {
          field: COUNTRY_SCHEMA_FIELD.path,
          type: MEASUREMENT_ENUM.NOMINAL
        }
      };
      ChartActions.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, CHART_CHANNEL_ENUM.DETAIL);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('allows un-encoding a detail encoding channel relationship', function(done) {
      const expectEncoded = {
        'detail': {
          field: COUNTRY_SCHEMA_FIELD.path,
          type: MEASUREMENT_ENUM.NOMINAL
        }
      };
      const expectUnencoded = {};
      ChartActions.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, CHART_CHANNEL_ENUM.DETAIL);
      setTimeout(() => {
        // Check that we encoded a channel first
        expect(this.store.state.channels).to.be.deep.equal(expectEncoded);

        // A `null` fieldPath should trigger a delete / un-encode
        // of the detail channel
        ChartActions.mapFieldToChannel(null, CHART_CHANNEL_ENUM.DETAIL);
        setTimeout(() => {
          expect(this.store.state.channels).to.be.deep.equal(expectUnencoded);
          done();
        });
      });
    });
    it('throws error on receiving an unknown encoding channel', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, 'FOO_BAR');
      };
      expect(throwFn).to.throw(/Unknown encoding channel "FOO_BAR" for chart type "Scatter Plot"/);
    });
    it('throws error on receiving an unknown field', function() {
      const throwFn = () => {
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.mapFieldToChannel('foo.bar', CHART_CHANNEL_ENUM.X);
      };
      expect(throwFn).to.throw(/Unknown field: foo.bar/);
    });
  });

  context('when calling the swapEncodedChannels action', function() {
    beforeEach((done) => {
      ChartActions.mapFieldToChannel(YEAR_SCHEMA_FIELD.path, CHART_CHANNEL_ENUM.X);
      ChartActions.selectAggregate(CHART_CHANNEL_ENUM.X, AGGREGATE_FUNCTION_ENUM.MAX);
      ChartActions.mapFieldToChannel(COUNTRY_SCHEMA_FIELD.path, CHART_CHANNEL_ENUM.Y);
      setTimeout(done);
    });
    it('swaps two encoded channels', function(done) {
      const expected = {
        'x': {
          field: COUNTRY_SCHEMA_FIELD.path,
          type: MEASUREMENT_ENUM.NOMINAL
        },
        'y': {
          field: YEAR_SCHEMA_FIELD.path,
          type: MEASUREMENT_ENUM.QUANTITATIVE,
          aggregate: AGGREGATE_FUNCTION_ENUM.MAX
        }
      };
      ChartActions.swapEncodedChannels(CHART_CHANNEL_ENUM.X, CHART_CHANNEL_ENUM.Y);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
    });
    it('swaps an encoded channel with an empty channel', function(done) {
      const expected = {
        'x': {
          field: YEAR_SCHEMA_FIELD.path,
          type: MEASUREMENT_ENUM.QUANTITATIVE,
          aggregate: AGGREGATE_FUNCTION_ENUM.MAX
        },
        'y': undefined,
        'detail': {
          field: COUNTRY_SCHEMA_FIELD.path,
          type: MEASUREMENT_ENUM.NOMINAL
        }
      };
      ChartActions.swapEncodedChannels(CHART_CHANNEL_ENUM.Y, CHART_CHANNEL_ENUM.DETAIL);
      setTimeout(() => {
        expect(this.store.state.channels).to.be.deep.equal(expected);
        done();
      });
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
      expect(throwFn).to.throw(/Unknown encoding channel "FOO_BAR" for chart type "Scatter Plot"/);
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
      expect(throwFn).to.throw(/Unknown encoding channel "FOO_BAR" for chart type "Scatter Plot"/);
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
      const chartType = 'Area Chart';
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

        // Set up a namespace change so the namespaceCache has been modified
        NamespaceStore.ns = 'mongodb.fanclub';
        ChartActions.selectChartType('Area Chart');

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

  context('before an array channel has been encoded', () => {
    it('throws error to remind developer to call mapFieldToChannel', () => {
      const throwFn = () => {
        const channel = CHART_CHANNEL_ENUM.X;
        const index = 0;
        const type = ARRAY_REDUCTION_TYPES.UNWIND;
        // ChartStore might not work on Reflux 5+, if so change it to ChartActions
        ChartStore.setArrayReduction(channel, index, type);
      };
      expect(throwFn).to.throw(/mapFieldToChannel not called for channel: x/);
    });
  });

  context('after an array channel has been encoded', () => {
    const field = UP_TO_5_TAGS_SCHEMA_FIELD;
    const channel = CHART_CHANNEL_ENUM.X;
    beforeEach(() => {
      ChartActions.mapFieldToChannel(field.path, channel);
    });

    context('when calling the setArrayReduction action', function() {
      let index;
      let type;

      it('stores an unwind array reduction', function(done) {
        index = 0;
        type = ARRAY_REDUCTION_TYPES.UNWIND;
        const expected = {
          [channel]: [{
            field: field.path,
            type: type,
            arguments: []
          }]
        };
        ChartActions.setArrayReduction(channel, index, type);
        setTimeout(() => {
          const reductions = this.store.state.reductions;
          expect(reductions).to.be.deep.equal(expected);
          done();
        });
      });

      it('stores index number of unwind reductions', function(done) {
        index = 2;
        type = ARRAY_REDUCTION_TYPES.UNWIND;
        const expected = {
          [channel]: [
            {
              field: field.path,
              type: type,
              arguments: []
            },
            {
              field: field.path,
              type: type,
              arguments: []
            },
            {
              field: field.path,
              type: type,
              arguments: []
            }
          ]
        };
        ChartActions.setArrayReduction(channel, 2, ARRAY_REDUCTION_TYPES.UNWIND);
        setTimeout(() => {
          const reductions = this.store.state.reductions;
          expect(reductions).to.be.deep.equal(expected);
          done();
        });
      });

      it('stores index number of unwind reductions and min after', function(done) {
        const expected = {
          [channel]: [
            {
              field: field.path,
              type: ARRAY_REDUCTION_TYPES.UNWIND,
              arguments: []
            },
            {
              field: field.path,
              type: ARRAY_REDUCTION_TYPES.UNWIND,
              arguments: []
            },
            {
              field: field.path,
              type: ARRAY_REDUCTION_TYPES.UNWIND,
              arguments: []
            },
            {
              field: field.path,
              type: ARRAY_REDUCTION_TYPES.MIN,
              arguments: []
            }
          ]
        };
        ChartActions.setArrayReduction(channel, 2, ARRAY_REDUCTION_TYPES.UNWIND);
        ChartActions.setArrayReduction(channel, 3, ARRAY_REDUCTION_TYPES.MIN);
        setTimeout(() => {
          const reductions = this.store.state.reductions;
          expect(reductions).to.be.deep.equal(expected);
          done();
        });
      });

      it('stores a max length reduction', function(done) {
        index = 0;
        type = ARRAY_REDUCTION_TYPES.MAX_LENGTH;
        const expected = {
          [channel]: [{
            field: field.path,
            type: type,
            arguments: []
          }]
        };
        ChartActions.setArrayReduction(channel, index, type);
        setTimeout(() => {
          const reductions = this.store.state.reductions;
          expect(reductions).to.be.deep.equal(expected);
          done();
        });
      });

      it('throws error on receiving an unknown reduction type', function(done) {
        const throwFn = () => {
          index = 0;
          type = 'BAD_REDUCER';
          // ChartStore might not work on Reflux 5+, if so change it to ChartActions
          ChartStore.setArrayReduction(channel, index, type);
        };
        setTimeout(() => {
          expect(throwFn).to.throw(/Expect a reduction type, got: BAD_REDUCER/);
          done();
        });
      });
    });
  });

  context('when calling multiple actions', function() {
    it('encodes every action in channels state', function(done) {
      // Expect 3 keys set
      const expected = {
        'x': {
          field: COUNTRY_SCHEMA_FIELD.path,
          type: 'nominal'
        },
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
        const options = app.dataService.aggregate.args[0][2];
        const pipeline = app.dataService.aggregate.args[0][1];
        const ns = app.dataService.aggregate.args[0][0];

        expect(ns).to.be.equal('foo.bar');
        expect(pipeline).to.be.deep.equal([ { '$match': {} }, { '$limit': 100 } ]);
        expect(options).to.be.deep.equal({
          'maxTimeMS': defaultQuery.maxTimeMS,
          'promoteValues': true
        });
      });
    });

    context('when calling with limit > 1000', () => {
      it('exceeds limit from 1000', () => {
        ChartStore._refreshDataCache(Object.assign({}, defaultQuery, {
          ns: 'foo.bar',
          limit: 5000
        }));
        const pipeline = app.dataService.aggregate.args[0][1];
        expect(pipeline).to.deep.equal([ { '$match': {} }, { '$limit': 5000 } ]);
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
        const options = app.dataService.aggregate.args[0][2];
        const pipeline = app.dataService.aggregate.args[0][1];
        const ns = app.dataService.aggregate.args[0][0];

        expect(ns).to.be.equal('foo.bar');
        expect(pipeline).to.be.deep.equal([
          {'$match': {foo: true}},
          {'$sort': {baz: 1}},
          {'$skip': 40},
          {'$limit': 9}
        ]);
        expect(options).to.be.deep.equal({
          'maxTimeMS': 10000,
          'promoteValues': true
        });
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
