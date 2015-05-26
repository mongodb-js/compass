var d3 = require('d3');

module.exports = {

  margin: {
    top: 10,
    right: 0,
    bottom: 10,
    left: 40
  },

  percentFormat: function(v) {
    // round max value to 1 digit precision
    var prec1Format = d3.format('.1r');
    var intFormat = d3.format('.0f');

    // multiply by 100 for percentages
    v *= 100;

    var top = v > 1 ? intFormat(v) : prec1Format(v);
    var mid = parseFloat(top) / 2;

    return ['0%', mid + '%', top + '%'];
  }
};
