var d3 = require('d3');
var _ = require('lodash');
var few = require('./few');
var many = require('./many');
var shared = require('./shared');

var minicharts_d3fns_string = function() {
  // --- beginning chart setup ---
  var width = 420;
  var height = 80;
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
    options = value;
    return chart;
  };

  return chart;
};


module.exports = minicharts_d3fns_string;


// function(opts) {
//   var values = opts.model.values.toJSON();
//
//   var margin = shared.margin;
//   var width = opts.width - margin.left - margin.right;
//   var height = opts.height - margin.top - margin.bottom;
//   var el = opts.el;
//
//   // group into labels and values per bucket, sort descending
//   var data = _(values)
//     .groupBy(function(d) {
//       return d;
//     })
//     .map(function(v, k) {
//       return {
//         label: k,
//         value: k,
//         count: v.length
//       };
//     })
//     .sortByOrder('count', [false]) // descending on value
//     .value();
//
//   // clear element first
//   d3.select(el).selectAll('*').remove();
//
//   var g = d3.select(el)
//     .append('g')
//     .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
//     .attr('width', width)
//     .attr('height', height);
//
//   var chartFn = data.length <= 5 ? few : many;
//   var chart = chartFn()
//     .width(width)
//     .height(height)
//     .options({
//       scale: true,
//       bgbars: false,
//       view: opts.view
//     });
//
//   d3.select(g)
//     .datum(data)
//     .call(chart);
//
//   // simulate data changes
//   // setInterval(function() {
//   //   _.each(data, function(d) {
//   //     d.count = _.random(0, 20);
//   //   });
//   //   data = _.sortByOrder(data, 'count', [false]);
//   //   d3.select(g).call(chart);
//   // }, 500);
// };
