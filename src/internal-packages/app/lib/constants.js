const LOADING_STATE = null;

/**
 * A list of chart specification types.
 */
const CHART_SPEC_TYPE_ENUM = Object.freeze({
  VEGA: 'vega',
  VEGA_LITE: 'vega-lite',
  CUSTOM: 'custom'
});

module.exports = {
  CHART_SPEC_TYPE_ENUM,
  LOADING_STATE
};
