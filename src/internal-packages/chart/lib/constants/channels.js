/**
 * An enumeration of valid Mark Properties Channels.
 *
 * @see https://vega.github.io/vega-lite/docs/encoding.html#props-channels
 */
const MARK_PROPERTY_CHANNEL_ENUM = Object.freeze({
  X: 'x',
  Y: 'y',
  X2: 'x2',
  Y2: 'y2',
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

module.exports = {
  CHART_CHANNEL_ENUM,
  MEASUREMENT_ENUM,
  MEASUREMENT_ICON_ENUM
};
