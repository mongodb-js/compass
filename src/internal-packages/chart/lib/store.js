const Reflux = require('reflux');
const {
  AGGREGATE_FUNCTION_ENUM,
  MEASUREMENT_ENUM,
  CHART_COLORS
} = require('./constants');
const Actions = require('./actions');
const StateMixin = require('reflux-state-mixin');
const app = require('hadron-app');
const ReadPreference = require('mongodb').ReadPreference;
const toNS = require('mongodb-ns');
const _ = require('lodash');

const debug = require('debug')('mongodb-compass:chart:store');

const HISTORY_STATE_FIELDS = ['specType', 'chartType', 'channels'];

const READ = ReadPreference.PRIMARY_PREFERRED;
const INITIAL_QUERY = {
  filter: {},
  sort: null,
  skip: 0,
  limit: 0,
  ns: '',
  maxTimeMS: 10000
};
// "color": CHART_COLORS.CHART0,

const LITE_SPEC_GLOBAL_SETTINGS = {
  'transform': {
    'filterInvalid': false
  },
  'config': {
    'mark': {
      'color': CHART_COLORS.CHART0,
      'opacity': 0.9,
      'strokeWidth': 3
    },
    'axis': {
      'titleColor': '#42494f',
      'titleFont': 'Akzidenz',
      'titleFontWeight': 'bold',
      'titleFontSize': 16,
      'tickColor': '#bfbfbe',
      'axisColor': '#42494f',
      'tickLabelFont': 'Akzidenz',
      'tickLabelFontSize': 12,
      'tickLabelColor': '#42494f',
      'subdivide': 3,
      'tickSizeMinor': 4,
      'tickSizeMajor': 6,
      'gridColor': '#42494f',
      'gridOpacity': 0.12,
      'grid': true
    }
  }
};

/**
 * The reflux store for the currently displayed Chart singleton.
 */
const ChartStore = Reflux.createStore({
  /**
   * Adds a state to the store, similar to React.Component's state.
   * Only needed until we upgrade to reflux 5+, e.g. via COMPASS-686.
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  init() {
    this.listenables = Actions;
    this._resetChart();

    this.INITIAL_CHART_TYPE = '';
    this.INITIAL_SPEC_TYPE = 'vega-lite';
    this.AVAILABLE_CHART_ROLES = [];
  },

  onActivated(appRegistry) {
    // set up listeners on external stores
    appRegistry.getStore('Query.ChangedStore').listen(this.onQueryChanged.bind(this));
    appRegistry.getStore('Schema.FieldStore').listen(this.onFieldsChanged.bind(this));

    const roles = appRegistry.getRole('Chart.Type');

    this.AVAILABLE_CHART_ROLES = roles;
    this.INITIAL_CHART_TYPE = roles[0].name;
    this.INITIAL_SPEC_TYPE = roles[0].specType;
    this._setDefaults();
  },

  _setDefaults() {
    this.setState({
      availableChartRoles: this.AVAILABLE_CHART_ROLES,
      chartType: this.INITIAL_CHART_TYPE,
      specType: this.INITIAL_SPEC_TYPE
    });
    this._resetHistory();
  },

  /**
   * Return the subset of initial store state focused on
   * cached values from other stores.
   *
   * @returns {Object} Cached subset of initial store state.
   */
  getInitialCacheState() {
    return {
      dataCache: [],
      fieldsCache: {},
      topLevelFields: [],
      queryCache: INITIAL_QUERY
    };
  },

  /**
   * Return the subset of initial store state focused on
   * the current chart.
   *
   * @returns {Object} Cached subset of initial store state.
   */
  getInitialChartState() {
    return {
      spec: {},
      specValid: false,
      specType: this.INITIAL_SPEC_TYPE,
      chartType: this.INITIAL_CHART_TYPE,
      // Use channels to construct the "encoding" of the vega-lite spec
      // https://vega.github.io/vega-lite/docs/spec.html#spec
      channels: {}
    };
  },

  /**
   * Initialize the Chart store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    const caches = this.getInitialCacheState();
    const chart = this.getInitialChartState();
    const history = {
      hasUndoableActions: false,
      hasRedoableActions: false
    };
    const availableChartRoles = {
      availableChartRoles: this.AVAILABLE_CHART_ROLES
    };
    return Object.assign({}, caches, chart, history, availableChartRoles);
  },

  /**
   * Completely resets the history and counters
   */
  _resetHistory() {
    // indicates the current position of the history
    this.history_position = 0;
    this.history_counter = 0;

    const initialHistoryState = _.pick(this.getInitialChartState(), HISTORY_STATE_FIELDS);
    initialHistoryState.id = this.history_counter;
    this.history = [ initialHistoryState ];

    this.setState({
      hasUndoableActions: false,
      hasRedoableActions: false
    });
  },

  _getUndoRedoState() {
    return {
      hasUndoableActions: this.history_position > 0,
      hasRedoableActions: this.history_position < this.history.length - 1
    };
  },

  /**
   * pushes the state to the history and manages the helper variables like
   * history_counter and history_position.
   *
   * @param {Object} state    The state to be added to the history.
   */
  _pushToHistory(state) {
    // don't push the new state if it is the same as the previous one
    if (_.isEqual(_.omit(this.history[this.history_position], 'id'), _.omit(state, 'id'))) {
      return;
    }
    // truncate history at the current position before adding new state
    this.history = this.history.slice(0, this.history_position + 1);
    this.history_counter = this.history_counter + 1;
    this.history_position = this.history_position + 1;
    state.id = this.history_counter;
    this.history.push( state );
  },

  /**
   * Completely resets the entire chart to its initial state.
   */
  _resetChart() {
    this.setState(this.getInitialState());
    this.history = [ _.pick(this.getInitialChartState(), HISTORY_STATE_FIELDS) ];
    this.history_position = 0;
  },

  /**
   * takes an `state.channels` object (created by UI interactions) and builds
   * a new vega data transform stream mapping field names to channel names.
   * Example transform mapping field name b to channel name x:
   *
   * {"type": "formula","as": "x","expr": "datum.b"},
   *
   * @param  {Object} channels   channels object
   * @return {Object}            vega data transform stream
   */
  _createVegaEncodingTransform(channels) {
    const transform = _.map(channels, (val, key) => {
      return {type: 'formula', as: key, expr: `datum.${val.field}`};
    });
    return {
      name: 'encoding',
      source: 'values',
      transform: transform
    };
  },

  /**
   * Any change to the store that can modify the spec goes through this
   * helper function. The new state is computed, the spec is created
   * based on the new state, and then the state (including the spec) is
   * set on the store. Also checks if the spec is valid and sets `specValid`
   * boolean.
   *
   * @param {Object} update          changes to the store state affecting the spec
   * @param {Boolean} pushToHistory  whether or not the new state should become
   *                                 part of the undo/redo-able history
   *
   * @see https://vega.github.io/vega-lite/docs/spec.html
   */
  _updateSpec(update, pushToHistory) {
    const newState = Object.assign({}, this.state, update);
    const chartRole = _.find(newState.availableChartRoles, 'name', newState.chartType);
    if (!chartRole) {
      throw new Error(`Unknown chart type: ${newState.chartType}`);
    }
    let spec;
    if (newState.specType === 'vega-lite') {
      // vega-lite specs overwrite global settings and receive enconding object
      const encoding = {encoding: newState.channels};
      spec = _.merge({}, LITE_SPEC_GLOBAL_SETTINGS, chartRole.spec, encoding);
    } else {
      // vega specs are augmented with a transform data stream
      const encoding = this._createVegaEncodingTransform(newState.channels);
      spec = _.cloneDeep(chartRole.spec);
      spec.data.unshift(encoding);
      spec.data.unshift({name: 'values'});
    }
    newState.spec = spec;

    // check if all required channels are encoded
    const requiredChannels = _.filter(chartRole.channels, (channel) => {
      return channel.required;
    }).map(channel => channel.name);
    const encodedChannels = Object.keys(newState.channels);
    newState.specValid = requiredChannels.length === _.intersection(requiredChannels, encodedChannels).length;
    if (newState.specValid) {
      debug('valid spec %j', newState.spec);
    }
    // push new chart state to history
    if (pushToHistory) {
      this._pushToHistory( _.cloneDeep(_.pick(newState, HISTORY_STATE_FIELDS)) );
    }
    const undoRedoState = this._getUndoRedoState();
    this.setState(_.assign(newState, undoRedoState));
  },

  /**
   * fetch data from server based on current query and sets the dataCache state
   * variable. Currently limits number of documents to 1000.
   *
   * @param {Object} query   the new query to fetch data for
   */
  _refreshDataCache(query) {
    const ns = toNS(query.ns);
    if (!ns.collection) {
      return;
    }

    const pipeline = [];
    const options = {
      readPreference: READ,
      maxTimeMS: query.maxTimeMS,
      promoteValues: true
    };

    if (query.filter) {
      pipeline.push({$match: query.filter});
    }

    if (query.sort) {
      pipeline.push({$sort: query.sort});
    }

    if (query.skip) {
      pipeline.push({$skip: query.skip});
    }

    if (query.limit) {
      pipeline.push({$limit: query.limit});
    }

    app.dataService.aggregate(ns.ns, pipeline, options, (error, documents) => {
      if (error) {
        // @todo handle error better? what kind of errors can happen here?
        throw error;
      }

      let state = {
        queryCache: query,
        dataCache: documents
      };

      if (this.state.queryCache.ns !== query.ns) {
        state = Object.assign(state, this.getInitialChartState());
      }

      this.setState(state);
    });
  },

  /**
   * returns the proposed mesurement for a given type string.
   *
   * @param {String} type    The type string, e.g. `Double`.
   * @return {String}        Measurement for that type.
   */
  _inferMeasurementFromType(type) {
    switch (type) {
      case 'Double':
      case 'Int32':
      case 'Long':
      case 'Decimal128': return MEASUREMENT_ENUM.QUANTITATIVE;
      case 'Date':
      case 'ObjectId':
      case 'Timestamp': return MEASUREMENT_ENUM.TEMPORAL;
      default: return MEASUREMENT_ENUM.NOMINAL;
    }
  },

  /**
   * returns the proposed mesurement for a given field, based on its type(s).
   * if the field contains multiple types, use the lowest (first) measurement
   * common to all of them.
   *
   * @param {Object} field    The field with a `.type` property.
   * @return {String}         Measurement for that field
   */
  _inferMeasurementFromField(field) {
    if (_.isString(field.type)) {
      return this._inferMeasurementFromType(field.type);
    }
    // if field has multiple types, find the lowest (first) common measurement type
    const measurements = _.map(field.type, this._inferMeasurementFromType.bind(this));
    return _.find(MEASUREMENT_ENUM, (val) => {
      return _.contains(measurements, val);
    });
  },

  /**
   * validates whether `channel` is a valid channel name for the given
   * chart type. Throws an error if not a valid channel.
   *
   * @param  {String} chartType   chart type as string, e.g. 'Bar Chart'
   * @param  {String} channel     channel name as string, e.g. 'x'
   */
  _validateEncodingChannel(chartType, channel) {
    const channelNames = _.find(this.AVAILABLE_CHART_ROLES, 'name',
      chartType).channels.map(ch => ch.name);
    if (!_.includes(_.values(channelNames), channel)) {
      throw new Error(`Unknown encoding channel "${channel}" for chart type `
        + `"${chartType}". Must be one of ${channelNames.join()}.`);
    }
  },

  /**
   * Undo of the last action, restoring the vega spec to the previous state.
   * Only affects actions that modify the spec.
   */
  undoAction() {
    if (this.history_position > 0) {
      this.history_position = this.history_position - 1;
      // update spec but do not push to history
      const state = _.omit(this.history[this.history_position], 'id');
      this._updateSpec(state, false);
    }
  },

  /**
   * Redo of the last (undone) action, restoring the vega spec to the next state.
   * Only affects actions that modify the spec.
   */
  redoAction() {
    if (this.history_position < this.history.length - 1) {
      this.history_position = this.history_position + 1;
      // update spec but do not push to history
      const state = _.omit(this.history[this.history_position], 'id');
      this._updateSpec(state, false);
    }
  },

  /**
   * Clears the chart, so it is set back to its default initial state but
   * retaining some things such as any data, namespace or query caches. Also
   * pushes the new state into the history.
   *
   * @param {Boolean} pushToHistory  whether or not the new state should become
   *                                 part of the undo/redo-able history
   */
  clearChart(pushToHistory = true) {
    if (pushToHistory) {
      this._pushToHistory( _.pick(this.getInitialChartState(), HISTORY_STATE_FIELDS) );
    }
    const state = this.getInitialChartState();
    const undoRedoState = this._getUndoRedoState();
    this.setState(_.assign(state, undoRedoState));
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged(state) {
    const newQuery = _.pick(state,
      ['filter', 'sort', 'skip', 'limit', 'maxTimeMS', 'ns']);
    this._refreshDataCache(newQuery);
  },


  /**
   * Fires when field store changes
   *
   * @param {Object} state - the field store state.
   */
  onFieldsChanged(state) {
    if (!state.fields) {
      return;
    }
    this.setState({fieldsCache: state.fields, topLevelFields: state.topLevelFields});
  },

  /**
   * Maps a MongoDB Schema field [1] to a Vega-lite encoding channel [2], such as
   * x, y, color, size, etc and stores it in the Vega-lite `field` key.
   *
   * @see [1] https://github.com/mongodb-js/mongodb-schema
   * @see [2] https://vega.github.io/vega-lite/docs/encoding.html#props-channels
   *
   * @param {String} fieldPath       the field path of the Schema field [1], or
   *                                 null to un-encode a channel.
   * @param {String} channel         the Vega-lite encoding channel [2].
   * @param {Boolean} pushToHistory  whether or not the new state should become
   *                                 part of the undo/redo-able history
   */
  mapFieldToChannel(fieldPath, channel, pushToHistory = true) {
    this._validateEncodingChannel(this.state.chartType, channel);

    const channels = _.cloneDeep(this.state.channels);
    if (fieldPath === null) {
      delete channels[channel];
    } else if (!_.has(this.state.fieldsCache, fieldPath)) {
      throw new Error('Unknown field: ' + fieldPath);
    } else {
      const prop = channels[channel] || {};
      const field = this.state.fieldsCache[fieldPath];
      // Vega Lite 'field' is required in this `spec`, however need to
      // display the short 'fieldName' for readability unless user mouses-over,
      // then also display the full 'field' tooltip.
      // @see https://vega.github.io/vega-lite/docs/encoding.html#field
      prop.field = fieldPath;
      prop.fieldName = field.name;
      prop.type = this._inferMeasurementFromField(field);
      channels[channel] = prop;
    }
    this._updateSpec({channels: channels}, pushToHistory);
  },

  /**
   * Swaps the contents of two channels.

   * @param {String} channel1       one of the channels to swap
   * @param {String} channel2       the other channel to swap
   * @param {Boolean} pushToHistory  whether or not the new state should become
   *                                 part of the undo/redo-able history
   */
  swapEncodedChannels(channel1, channel2, pushToHistory = true) {
    this._validateEncodingChannel(this.state.chartType, channel1);
    this._validateEncodingChannel(this.state.chartType, channel2);

    const channels = _.cloneDeep(this.state.channels);
    const tempChannel = channels[channel1];
    channels[channel1] = channels[channel2];
    channels[channel2] = tempChannel;
    this._updateSpec({channels: channels}, pushToHistory);
  },

  /**
   * Encodes the measurement (or data-type) for a channel.
   *
   * @see https://vega.github.io/vega-lite/docs/encoding.html#data-type
   *
   * @param {String} channel         The Vega-lite encoding channel
   * @param {String} measurement     The Vega-Lite data type measurement
   * @param {Boolean} pushToHistory  whether or not the new state should become
   *                                 part of the undo/redo-able history
   */
  selectMeasurement(channel, measurement, pushToHistory = true) {
    this._validateEncodingChannel(this.state.chartType, channel);

    if (!(_.includes(_.values(MEASUREMENT_ENUM), measurement))) {
      throw new Error('Unknown encoding measurement: ' + measurement);
    }
    const channels = _.cloneDeep(this.state.channels);
    const prop = channels[channel] || {};
    prop.type = measurement;
    channels[channel] = prop;
    this._updateSpec({channels: channels}, pushToHistory);
  },

  /**
   * Encodes the aggregate function for a channel.
   *
   * @see https://vega.github.io/vega-lite/docs/aggregate.html
   *
   * @param {String} channel         The Vega-lite encoding channel
   * @param {String} aggregate       The aggregate function to apply
   * @param {Boolean} pushToHistory  whether or not the new state should become
   *                                 part of the undo/redo-able history
   */
  selectAggregate(channel, aggregate, pushToHistory = true) {
    this._validateEncodingChannel(this.state.chartType, channel);

    if (!(_.includes(_.values(AGGREGATE_FUNCTION_ENUM), aggregate))) {
      throw new Error('Unknown encoding aggregate: ' + aggregate);
    }
    const channels = _.cloneDeep(this.state.channels);
    const prop = channels[channel] || {};
    prop.aggregate = aggregate;
    if (aggregate === AGGREGATE_FUNCTION_ENUM.NONE) {
      delete prop.aggregate;
    }
    channels[channel] = prop;
    this._updateSpec({channels: channels}, pushToHistory);
  },

  /**
   * Changes the type of chart the user has selected for display.
   *
   * @param {String} chartType       The name of chart, e.g. 'Bar Chart' or 'Scatter Plot'
   * @param {Boolean} pushToHistory  whether or not the new state should become
   *                                 part of the undo/redo-able history
   */
  selectChartType(chartType, pushToHistory = true) {
    const chartRole = _.find(this.AVAILABLE_CHART_ROLES, 'name', chartType);
    if (!chartRole) {
      throw new Error('Unknown chart type: ' + chartType);
    }

    // @TODO must also update specType here when selecting a vega role
    this._updateSpec({
      channels: {},
      chartType: chartType,
      specType: chartRole.specType
    }, pushToHistory);
  },

  storeDidUpdate(prevState) {
    debug('chart store changed from', prevState, 'to', this.state);
  }
});

module.exports = ChartStore;
