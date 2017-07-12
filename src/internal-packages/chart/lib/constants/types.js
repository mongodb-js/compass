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

module.exports = {
  VIEW_TYPE_ENUM,
  SPEC_TYPE_ENUM
};
