const Reflux = require('reflux');
const {
  AGGREGATE_FUNCTION_ENUM,
  CHART_CHANNEL_ENUM,
  CHART_TYPE_ENUM,
  DEFAULTS,
  MEASUREMENT_ENUM
} = require('./constants');
const Actions = require('./actions');
const StateMixin = require('reflux-state-mixin');
const app = require('hadron-app');
const ReadPreference = require('mongodb').ReadPreference;
const toNS = require('mongodb-ns');
const _ = require('lodash');

// const debug = require('debug')('mongodb-compass:chart:store');

const READ = ReadPreference.PRIMARY_PREFERRED;
const INITIAL_QUERY = {
  filter: {},
  sort: null,
  project: null,
  skip: 0,
  limit: 100,
  ns: '',
  maxTimeMS: 10000
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
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));
    this.listenToExternalStore('Schema.FieldStore', this.onFieldChanged.bind(this));
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
      rootFields: [],
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
      specType: DEFAULTS.SPEC_TYPE,
      chartType: DEFAULTS.CHART_TYPE,
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
    return Object.assign({}, caches, chart);
  },

  /**
   * Completely resets the entire chart to its initial state.
   */
  _resetChart() {
    this.setState(this.getInitialState());
  },

  /**
   * fetch data from server based on current query and sets the dataCache state
   * variable. Currently limits number of documents to 100.
   *
   * @param {Object} query   the new query to fetch data for
   */
  _refreshDataCache(query) {
    const ns = toNS(query.ns);
    if (!ns.database || !ns.collection) {
      return;
    }

    // limit document number to 100 for now.
    const findOptions = {
      sort: _.isEmpty(query.sort) ? null : _.pairs(query.sort),
      fields: query.project,
      skip: query.skip,
      limit: query.limit ? Math.min(100, query.limit) : 100,
      readPreference: READ,
      maxTimeMS: query.maxTimeMS,
      promoteValues: true
    };

    app.dataService.find(ns.ns, query.filter, findOptions, (error, documents) => {
      if (error) {
        // @todo handle error better? what kind of errors can happen here?
        throw error;
      }
      this.setState({
        queryCache: query,
        dataCache: documents
      });
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
   * Clears the chart, so it is set back to its default initial state but
   * retaining some things such as any data, namespace or query caches.
   */
  clearChart() {
    this.setState(this.getInitialChartState());
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged(state) {
    const newQuery = _.pick(state,
      ['filter', 'sort', 'project', 'skip', 'limit', 'maxTimeMS', 'ns']);
    this._refreshDataCache(newQuery);
  },


  /**
   * Fires when field store Changes
   *
   * @param {Object} state - the field store state.
   */
  onFieldChanged(state) {
    if (!state.fields) {
      return;
    }

    this.setState({fieldsCache: state.fields, rootFields: state.rootFields});
  },

  /**
   * Maps a Vega-lite encoding channel, such as x, y, color, size, etc [1]
   * to a MongoDB Schema field [2] and stores it in the Vega-lite `field` key.
   *
   * @see [1] https://vega.github.io/vega-lite/docs/encoding.html#props-channels
   * @see [2] https://github.com/mongodb-js/mongodb-schema
   *
   * @param {String} channel - The Vega-lite encoding channel [1].
   * @param {String} field - The MongoDB Schema field [2].
   */
  mapFieldToChannel(channel, field) {
    if (!(_.includes(_.values(CHART_CHANNEL_ENUM), channel))) {
      throw new Error('Unknown encoding channel: ' + channel);
    }
    const channels = this.state.channels;
    const prop = channels[channel] || {};
    prop.field = field;
    // Waiting on COMPASS-727 to provide FieldsStore
    // prop.type = this._inferMeasurementFromField(this.props.fieldsCache[field]));
    channels[channel] = prop;
    this.setState({channels: channels});
  },

  /**
   * Encodes the measurement (or data-type) for a channel.
   *
   * @see https://vega.github.io/vega-lite/docs/encoding.html#data-type
   *
   * @param {String} channel - The Vega-lite encoding channel
   * @param {String} measurement - The Vega-Lite data type measurement
   */
  selectMeasurement(channel, measurement) {
    if (!(_.includes(_.values(CHART_CHANNEL_ENUM), channel))) {
      throw new Error('Unknown encoding channel: ' + channel);
    }
    if (!(_.includes(_.values(MEASUREMENT_ENUM), measurement))) {
      throw new Error('Unknown encoding measurement: ' + measurement);
    }
    const channels = this.state.channels;
    const prop = channels[channel] || {};
    prop.type = measurement;
    channels[channel] = prop;
    this.setState({channels: channels});
  },

  /**
   * Encodes the aggregate function for a channel.
   *
   * @see https://vega.github.io/vega-lite/docs/aggregate.html
   *
   * @param {String} channel - The Vega-lite encoding channel
   * @param {String} aggregate - The aggregate function to apply
   */
  selectAggregate(channel, aggregate) {
    if (!(_.includes(_.values(CHART_CHANNEL_ENUM), channel))) {
      throw new Error('Unknown encoding channel: ' + channel);
    }
    if (!(_.includes(_.values(AGGREGATE_FUNCTION_ENUM), aggregate))) {
      throw new Error('Unknown encoding aggregate: ' + aggregate);
    }
    const channels = this.state.channels;
    const prop = channels[channel] || {};
    prop.aggregate = aggregate;
    channels[channel] = prop;
    this.setState({channels: channels});
  },

  /**
   * Changes the type of chart the user has selected for display.
   *
   * @param {String} chartType - The kind of chart, e.g. 'bar' or 'line'.
   */
  selectChartType(chartType) {
    if (!(_.includes(_.values(CHART_TYPE_ENUM), chartType))) {
      throw new Error('Unknown chart type: ' + chartType);
    }
    this.setState({chartType: chartType});
  },

  /**
   * Returns the current Vega-Lite spec document the store holds.
   *
   * @return {Object} A Vega-Lite spec
   * @see https://vega.github.io/vega-lite/docs/spec.html
   */
  getVegaLiteSpec() {
    const channels = this.state.channels;
    return {
      data: {values: this.state.dataCache},
      mark: this.state.chartType,
      encoding: channels
    };
  }
});

module.exports = ChartStore;
