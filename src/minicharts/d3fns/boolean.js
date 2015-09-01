var d3 = require('d3');
var _ = require('lodash');
var few = require('./few');
var shared = require('./shared');
// var debug = require('debug')('scout:minicharts:boolean');

var minicharts_d3fns_boolean = function() {
  // --- beginning chart setup ---
  var width = 400;
  var height = 100;
  var options = {
    view: null
  };
  var fewChart = few();
  var margin = shared.margin;
  // --- end chart setup ---

  function chart(selection) {
    selection.each(function(data) {
      var el = d3.select(this);
      var innerWidth = width - margin.left - margin.right;
      var innerHeight = height - margin.top - margin.bottom;

      // group by true/false
      var grouped = _(data)
        .groupBy(function(d) {
          return d;
        })
        .defaults({
          false: [],
          true: []
        })
        .map(function(v, k) {
          return {
            label: k,
            value: k === 'true',
            count: v.length
          };
        })
        .sortByOrder('label', [false]) // order: false, true
        .value();

      fewChart
        .width(innerWidth)
        .height(innerHeight)
        .options(options);

      var g = el.selectAll('g').data([grouped]);

      // append g element if it doesn't exist yet
      g.enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      g.call(fewChart);
    });
  }

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };

  chart.options = function(value) {
    if (!arguments.length) return options;
    _.assign(options, value);
    return chart;
  };

  return chart;
};

module.exports = minicharts_d3fns_boolean;
