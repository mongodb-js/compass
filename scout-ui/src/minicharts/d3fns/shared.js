var d3 = require('d3');
var debug = require('debug')('scout-ui:minicharts:shared');


// source: http://stackoverflow.com/questions/9539513/is-there-a-reliable-way-in-javascript-to-obtain-the-number-of-decimal-places-of
function decimalPlaces(number) {
  return ((+number).toFixed(20)).replace(/^-?\d*\.?|0+$/g, '').length;
}

module.exports = {

  margin: {
    top: 10,
    right: 0,
    bottom: 10,
    left: 40
  },

  friendlyPercentFormat: function(vmax) {
    var prec1Format = d3.format('.1r');
    var intFormat = d3.format('.0f');
    var format = (vmax > 1) ? intFormat : prec1Format;
    var maxFormatted = format(vmax);
    var maxDecimals = decimalPlaces(maxFormatted);

    return function(v, incPrec) {
      if (v === vmax) {
        return maxFormatted + '%';
      }
      if (v > 1 && !incPrec) { // v > vmax || maxFormatted % 2 === 0
        return d3.round(v, maxDecimals) + '%';
      }
      // adjust for corrections, if increased precision required
      return d3.round(v / vmax * maxFormatted, maxDecimals + 1) + '%';
    };
  }
};
