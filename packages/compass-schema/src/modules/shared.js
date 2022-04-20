/* eslint camelcase: 0 */
import d3 from 'd3';

// source: http://bit.ly/1Tc9Tp5
function decimalPlaces(number) {
  return (+number).toFixed(20).replace(/^-?\d*\.?|0+$/g, '').length;
}

const minicharts_d3fns_shared = {
  margin: {
    top: 10,
    right: 0,
    bottom: 10,
    left: 40,
  },

  friendlyPercentFormat: function (vmax) {
    const prec1Format = d3.format('.1r');
    const intFormat = d3.format('.0f');
    const format = vmax > 1 ? intFormat : prec1Format;
    const maxFormatted = format(vmax);
    const maxDecimals = decimalPlaces(maxFormatted);

    return function (v, incPrec) {
      if (v === vmax) {
        return maxFormatted + '%';
      }
      if (v > 1 && !incPrec) {
        // v > vmax || maxFormatted % 2 === 0
        return d3.round(v, maxDecimals) + '%';
      }
      // adjust for corrections, if increased precision required
      return d3.round((v / vmax) * maxFormatted, maxDecimals + 1) + '%';
    };
  },

  truncateTooltip: function (text, maxLength) {
    maxLength = maxLength || 500;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength - 1) + '&hellip;';
    }
    return text;
  },

  tooltip: function (label, count) {
    return `
      <div class="tooltip-wrapper">
        <div class="tooltip-label">${label}</div>
      <div class=".tooltip-value">${count}</div>
      </div>`;
  },
};

export default minicharts_d3fns_shared;
