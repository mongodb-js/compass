var d3 = require('d3');
var _ = require('lodash');
var few = require('./few');
var many = require('./many');
var shared = require('./shared');

module.exports = function(opts) {
  var values = opts.model.values.toJSON();

  var margin = shared.margin;
  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  // group into labels and values per bucket, sort descending
  var data = _(values)
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

  // clear element first
  d3.select(el).selectAll('*').remove();

  var g = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('width', width)
    .attr('height', height);

  var chartFn = data.length <= 5 ? few.newFn : many.newFn;
  var chart = chartFn()
    .width(width)
    .height(height)
    .options({
      scale: true,
      bgbars: false,
      view: opts.view
    });

  d3.select(g)
    .datum(data)
    .call(chart);

  // simulate data changes
  // setInterval(function() {
  //   _.each(data, function(d) {
  //     d.count = _.random(0, 20);
  //   });
  //   data = _.sortByOrder(data, 'count', [false]);
  //   d3.select(g).call(chart);
  // }, 500);
};
