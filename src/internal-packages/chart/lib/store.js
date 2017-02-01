const Reflux = require('reflux');
const { NamespaceStore } = require('hadron-reflux-store');
const {
  AGGREGATE_FUNCTION_ENUM,
  CHART_TYPE_ENUM,
  DEFAULTS,
  MARK_PROPERTY_ENUM,
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

    this.listenTo(NamespaceStore, this.onNamespaceChanged);
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
      dataCache: [],       // TODO: Populate with a $sample if ns or query change?
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
    // TODO How should we subscribe to schema updates?
    // this.setState({fieldsCache: []});     // From SchemaStore
  },

  /**
   * Maps a Vega-lite encoding property, such as x, y, color, size, etc [1]
   * to a MongoDB Schema field [2] and stores it in the Vega-lite `field` key.
   *
   * @see [1] https://vega.github.io/vega-lite/docs/encoding.html#props-channels
   * @see [2] https://github.com/mongodb-js/mongodb-schema
   *
   * @param {String} property - The Vega-lite encoding property [1].
   * @param {String} field - The MongoDB Schema field [2].
   */
  selectField(property, field) {
    if (!(property in MARK_PROPERTY_ENUM)) {
      throw new Error('Unknown encoding property: ' + property);
    }
    const channels = this.state.channels;
    const prop = channels[property] || {};
    prop.field = field;
    channels[property] = prop;
    this.setState({channels: channels});
  },

  /**
   * Encodes the measurement (or data-type) for a property.
   *
   * @see https://vega.github.io/vega-lite/docs/encoding.html#data-type
   *
   * @param {String} property - The Vega-lite encoding property
   * @param {String} measurement - The Vega-Lite data type measurement
   */
  selectMeasurement(property, measurement) {
    if (!(property in MARK_PROPERTY_ENUM)) {
      throw new Error('Unknown encoding property: ' + property);
    }
    if (!(measurement in MEASUREMENT_ENUM)) {
      throw new Error('Unknown encoding measurement: ' + measurement);
    }
    const channels = this.state.channels;
    const prop = channels[property] || {};
    prop.measurement = measurement;
    channels[property] = prop;
    this.setState({channels: channels});
  },

  /**
   * Encodes the aggregate function for a property.
   *
   * @see https://vega.github.io/vega-lite/docs/aggregate.html
   *
   * @param {String} property - The Vega-lite encoding property
   * @param {String} aggregate - The aggregate function to apply
   */
  selectAggregate(property, aggregate) {
    if (!(property in MARK_PROPERTY_ENUM)) {
      throw new Error('Unknown encoding property: ' + property);
    }
    if (!(aggregate in AGGREGATE_FUNCTION_ENUM)) {
      throw new Error('Unknown encoding aggregate: ' + aggregate);
    }
    const channels = this.state.channels;
    const prop = channels[property] || {};
    prop.aggregate = aggregate;
    channels[property] = prop;
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
  }
});

module.exports = ChartStore;
