const channels = require('./channels');
const types = require('./types');

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

/**
 * (@satyasinha) TODO add this tooltip for the Array Reduce icon via COMPASS-1228
 */
const TOOL_TIP_ARRAY_REDUCE = Object.freeze({
  'data-for': 'array-reduce-tooltip',
  'data-tip': 'In order to use fields or values<br/>'
    + 'inside an array, the array has to<br/>'
    + 'be reduced to a scalar value.<br/>'
    + 'Choose from the array reduction<br/>'
    + 'methods.'
});

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
  MEAN: 'mean',
  SUM: 'sum'
});

/**
 * A list of the string array reduction types, or accumulates.
 */
const ARRAY_STRING_REDUCTIONS = Object.freeze({
  CONCAT: 'concat',
  MIN_LENGTH: 'min length',
  MAX_LENGTH: 'max length',
  LONGEST: 'longest',
  SHORTEST: 'shortest'
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

/**
 * The maximum size of chart axis labels.
 * @type {number}
 */
const AXIS_LABEL_MAX_PIXELS = 150;

/**
 * The size of the chart axis title, margins and padding,
 * to avoid scrollbars appearing.
 * @type {number}
 */
const AXIS_TITLE_BUFFER_PIXELS = 50;

/**
 * The smallest chart height in pixels, to avoid negative size errors.
 */
const MIN_CHART_HEIGHT = 50;

/**
 * The smallest chart width in pixels, to avoid negative size errors.
 */
const MIN_CHART_WIDTH = 50;

const LITE_SPEC_GLOBAL_SETTINGS = {
  'config': {
    'mark': {
      'color': CHART_COLORS.CHART0,
      'opacity': 0.9,
      'strokeWidth': 3
    },
    'axis': {
      'domainColor': '#42494f',
      'grid': true,
      'gridColor': '#bfbfbe',
      'gridOpacity': 0.12,
      'labelColor': '#42494f',
      'labelFont': 'Akzidenz',
      'labelFontSize': 12,
      'labelLimit': AXIS_LABEL_MAX_PIXELS,
      'subdivide': 3,
      'tickColor': '#42494f',
      'tickSizeMajor': 6,
      'tickSizeMinor': 4,
      'titleColor': '#42494f',
      'titleFont': 'Akzidenz',
      'titleFontSize': 16,
      'titleFontWeight': 'bold'
    }
  }
};

module.exports = Object.assign({
  TOOL_TIP_ARRAY_REDUCE,
  ARRAY_GENERAL_REDUCTIONS,
  ARRAY_NUMERIC_REDUCTIONS,
  ARRAY_STRING_REDUCTIONS,
  ARRAY_REDUCTION_TYPES,
  CHART_COLORS,
  AXIS_LABEL_MAX_PIXELS,
  AXIS_TITLE_BUFFER_PIXELS,
  MIN_CHART_HEIGHT,
  MIN_CHART_WIDTH,
  LITE_SPEC_GLOBAL_SETTINGS
}, channels, types);
