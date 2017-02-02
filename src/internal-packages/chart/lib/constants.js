/**
 * An enumeration of the subset of Vega-Lite aggregates we support.
 * For a full list of things we could add, see:
 *
 * @see https://vega.github.io/vega-lite/docs/aggregate.html
 */
const AGGREGATE_FUNCTION_ENUM = Object.freeze({
  COUNT: 'count',
  DISTINCT: 'distinct',
  SUM: 'sum',
  MEAN: 'mean',
  VARIANCE: 'variance',
  VARIANCEP: 'variancep',
  STDEV: 'stdev',
  STDEVP: 'stdevp',
  MEDIAN: 'median',
  Q1: 'q1',
  Q3: 'q3',
  MIN: 'min',
  MAX: 'max'
});

/**
 * An enumeration of supported chart types to choose from,
 * each roughly corresponds to a Vega-Lite mark.
 *
 * @see https://vega.github.io/vega-lite/docs/mark.html
 */
const CHART_TYPE_ENUM = Object.freeze({
  TEXT: 'text',
  LINE: 'line',
  BAR: 'bar',
  AREA: 'area',
  DOT: 'dot',
  DONUT: 'donut'
});

/**
 * An enumeration of valid Mark Properties Channels.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#props-channels
 */
const MARK_PROPERTY_CHANNEL_ENUM = Object.freeze({
  X: 'x',
  Y: 'y',
  COLOR: 'color',
  OPACITY: 'opacity',
  SHAPE: 'shape',
  SIZE: 'size',
  TEXT: 'text'
  // Not doing row/column faceting yet
});

/**
 * An enumeration of the valid Data Type, or Measurement values.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#data-type
 */
const MEASUREMENT_ENUM = Object.freeze({
  QUANTITATIVE: 'quantitative',
  TEMPORAL: 'temporal',
  ORDINAL: 'ordinal',
  NOMINAL: 'nominal'
});

/**
 * A list of chart specifications we might end up using...
 * if we end up not using them or not finding much similarity then nuke this.
 */
const SPEC_TYPE_ENUM = Object.freeze({
  VEGA: 'vega',
  VEGA_LITE: 'vega-lite',
  CUSTOM: 'custom'
});

const DEFAULTS = Object.freeze({
  CHART_TYPE: CHART_TYPE_ENUM.LINE,
  SPEC_TYPE: SPEC_TYPE_ENUM.VEGA_LITE
});

module.exports = {
  AGGREGATE_FUNCTION_ENUM,
  CHART_TYPE_ENUM,
  DEFAULTS,
  MEASUREMENT_ENUM,
  MARK_PROPERTY_CHANNEL_ENUM,
  SPEC_TYPE_ENUM
};
