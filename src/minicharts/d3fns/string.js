var d3 = require('d3');
var _ = require('lodash');
var few = require('./few');
var many = require('./many');
var shared = require('./shared');

var minicharts_d3fns_string = function() {
  // --- beginning chart setup ---
  var width = 400;
  var height = 100;
  var options = {
    view: null
  };
  var fewChart = few();
  var manyChart = many();
  var margin = shared.margin;
  // --- end chart setup ---

  function chart(selection) {
    selection.each(function(data) {
      var el = d3.select(this);
      var innerWidth = width - margin.left - margin.right;
      var innerHeight = height - margin.top - margin.bottom;

      // group into labels and values per bucket, sort descending
      var grouped = _(data)
        .groupBy(function(d) {
          return d;
        })
        .map(function(v, k) {
          return {
            label: k,
            value: k,
            count: v.length
          };
        })
        .sortByOrder('count', [false]) // descending on value
        .value();


      var g = el.selectAll('g').data([grouped]);

      // append g element if it doesn't exist yet
      g.enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', innerWidth)
        .attr('height', innerHeight);

      var chartFn = grouped.length <= 5 ? fewChart : manyChart;
      options.scale = true;

      chartFn
        .width(innerWidth)
        .height(innerHeight)
        .options(options);

      g.call(chartFn);
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

module.exports = minicharts_d3fns_string;
