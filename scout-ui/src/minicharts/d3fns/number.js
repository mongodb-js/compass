var d3 = require('d3');
var _ = require('lodash');
var many = require('./many');
var debug = require('debug')('minicharts:views:number');

module.exports = function(opts) {
  var values = opts.data;

  var margin = {
    top: 10,
    right: 0,
    bottom: 10,
    left: 0
  };

  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  // use the linear scale just to get nice binning values
  var x = d3.scale.linear()
    .domain(d3.extent(values))
    .range([0, width]);

  // Generate a histogram using approx. twenty uniformly-spaced bins
  var ticks = x.ticks(20);
  var hist = d3.layout.histogram()
    .bins(ticks);

  var data = hist(values);
  _.each(data, function (d, i) {
    if (i === 0) {
      d.tooltip = '< ' + (d.x+d.dx);
    }
    else if (i === data.length - 1) {
      d.tooltip = '&ge; ' + d.x;
    } else {
      d.tooltip = d.x + '-' + (d.x+d.dx);
    }
  });

  // clear element first
  d3.select(el).selectAll('*').remove();

  var g = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  many(data, g, width, height-10, {
    text: function (d, i) {
      if (i === 0) return d3.min(values);
      if (i === data.length - 1) return d3.max(values);
      return '';
    }
  });
};

