const Reflux = require('reflux');
const { NamespaceStore } = require('hadron-reflux-store');
const {
  AGGREGATE_FUNCTION_ENUM,
  CHART_CHANNEL_ENUM,
  CHART_TYPE_ENUM,
  DEFAULTS,
  MEASUREMENT_ENUM
} = require('./constants');
const Actions = require('./actions');
const StateMixin = require('reflux-state-mixin');
const _ = require('lodash');

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

    this.listenTo(NamespaceStore, this.onNamespaceChanged.bind(this));
    this.listenToExternalStore('Query.ChangedStore', this.onQueryChanged.bind(this));
    this.listenToExternalStore('Schema.Store', this.onSchemaChanged.bind(this));
  },

  /**
   * Return the subset of initial store state focused on
   * cached values from other stores.
   *
   * @returns {Object} Cached subset of initial store state.
   */
  getInitialCacheState() {
    return {
      dataCache: [],       // TODO: COMPASS-726 Populate with a $sample if ns or query change?
      fieldsCache: [],
      namespaceCache: '',
      // TODO: Possible COMPASS-631 conflicts? Check name of "filter/query" remains appropriate.
      queryCache: {}
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
   * Clears the chart, so it is set back to its default initial state but
   * retaining some things such as any data, namespace or query caches.
   */
  clearChart() {
    this.setState(this.getInitialChartState());
  },

  /**
   * Fires when the namespace changes.
   *
   * @param {String} namespace - The namespace.
   */
  onNamespaceChanged(namespace) {
    this.setState({namespaceCache: namespace});
  },

  /**
   * Fires when the query is changed.
   *
   * @param {Object} state - The query state.
   */
  onQueryChanged(state) {
    if (state.query) {
      this.setState({queryCache: state.query});
    }
  },

  /**
   * TODO
   */
  onSchemaChanged() {
    // TODO COMPASS-727 How should we subscribe to schema updates?
    // this.setState({fieldsCache: []});     // From SchemaStore or FieldStore
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
    // TODO: COMPASS-728: Infer default encoding channel measurement using schema/fields
    // Might also be able to be done elsewhere in this store...
    return {
      data: {values: this.state.dataCache},
      mark: this.state.chartType,
      encoding: channels
    };
  }
});

module.exports = ChartStore;
