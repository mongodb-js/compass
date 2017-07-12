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

module.exports = {
  CHART_COLORS,
  AXIS_LABEL_MAX_PIXELS,
  AXIS_TITLE_BUFFER_PIXELS,
  MIN_CHART_HEIGHT,
  MIN_CHART_WIDTH,
  LITE_SPEC_GLOBAL_SETTINGS
};
