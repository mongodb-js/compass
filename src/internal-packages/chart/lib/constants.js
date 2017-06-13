/**
 * An enumeration of the subset of Vega-Lite aggregates we support.
 * For a full list of things we could add, see:
 *
 * @see https://vega.github.io/vega-lite/docs/aggregate.html
 */
const AGGREGATE_FUNCTION_ENUM = Object.freeze({
  NONE: '(none)',
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
 * An enumeration for the Detail Channel.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#additional-level-of-detail-channel
 */
const DETAIL_CHANNEL_ENUM = Object.freeze({
  DETAIL: 'detail'
});

// Omit for V1 unless we find a compelling use case :)
// https://vega.github.io/vega-lite/docs/encoding.html#mark-order-channels
// const ORDER_CHANNEL_ENUM = ...
// https://vega.github.io/vega-lite/docs/encoding.html#facet
// const FACET_CHANNEL_ENUM = ...

/**
 * Bundle of all valid Vega-Lite channel types we plan to support in Compass.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#channels
 */
const CHART_CHANNEL_ENUM = Object.freeze(Object.assign({},
    MARK_PROPERTY_CHANNEL_ENUM,
    DETAIL_CHANNEL_ENUM
));

/**
 * An enumeration of the valid Data Type, or Measurement values.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#data-type
 */
const MEASUREMENT_ENUM = Object.freeze({
  NOMINAL: 'nominal',
  ORDINAL: 'ordinal',
  QUANTITATIVE: 'quantitative',
  TEMPORAL: 'temporal'
});

/**
 * Icons to measurement mapping
 * @type {Class} font-awesome icons
 */
const MEASUREMENT_ICON_ENUM = Object.freeze({
  [MEASUREMENT_ENUM.NOMINAL]: 'font',
  [MEASUREMENT_ENUM.ORDINAL]: 'sort-amount-asc',
  [MEASUREMENT_ENUM.QUANTITATIVE]: 'hashtag',
  [MEASUREMENT_ENUM.TEMPORAL]: 'calendar'
});

const CHART_COLORS = Object.freeze({
  CHART0: '#43B1E5',
  CHART1: '#F68A1E',
  CHART2: '#F38183',
  CHART3: '#26A348',
  CHART4: '#FBB129',
  CHART5: '#92A83B',
  CHART6: '#46929A',
  CHART7: '#D381B3',
  CHART8: '#85CA98'
});

const VIEW_TYPE_ENUM = Object.freeze({
  CHART_BUILDER: 'Chart Builder',
  JSON_EDITOR: 'JSON Editor'
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

const TOOL_TIP_ID_ARRAY = 'array-not-supported';

/**
 * A list of the general array reduction types.
 */
const ARRAY_GENERAL_REDUCTIONS = Object.freeze({
  UNWIND: 'Unwind array',
  LENGTH: 'Array length',
  INDEX: 'Array element by index'  // TODO: Note is args not implemented in React <ArrayReductionPicker>
});

/**
 * A list of the numeric array reduction types, or accumulates.
 */
const ARRAY_NUMERIC_REDUCTIONS = Object.freeze({
  MIN: 'min',
  MAX: 'max',
  MEAN: 'mean'
  // SUM: 'sum'  // TODO: Not implemented in arrayReductionAggBuilder
});

/**
 * A list of the string array reduction types, or accumulates.
 */
const ARRAY_STRING_REDUCTIONS = Object.freeze({
  // CONCAT: 'concat',  // TODO: Not implemented in arrayReductionAggBuilder
  MIN_LENGTH: 'min length',
  MAX_LENGTH: 'max length'
  // LONGEST: 'longest',  // TODO: Not implemented in arrayReductionAggBuilder
  // SHORTEST: 'shortest'  // TODO: Not implemented in arrayReductionAggBuilder
});

/**
 * A list of all the array reduction types available.
 */
const ARRAY_REDUCTION_TYPES = Object.freeze(Object.assign(
  {},
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS
));

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

module.exports = {
  AGGREGATE_FUNCTION_ENUM,
  CHART_CHANNEL_ENUM,
  MEASUREMENT_ENUM,
  MEASUREMENT_ICON_ENUM,
  SPEC_TYPE_ENUM,
  VIEW_TYPE_ENUM,
  TOOL_TIP_ID_ARRAY,
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  ARRAY_REDUCTION_TYPES,
  CHART_COLORS,
  LITE_SPEC_GLOBAL_SETTINGS
};
