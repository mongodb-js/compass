var d3 = require('d3');
var _ = require('lodash');
var debug = require('debug')('minicharts:views:category');
var few = require('./few');
var many = require('./many');

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

  // group into categories (x) and count (y) the values per bucket, sort descending
  var categories = _(values)
    .groupBy(function(d) {
      return d;
    })
    .map(function(v, k) {
      return {
        x: k,
        y: v.length,
        tooltip: k
      };
    })
    .sortByOrder('y', [false]) // descending on y
    .value();

  // clear element first
  d3.select(el).selectAll('*').remove();

  var g = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('width', width)
    .attr('height', height);

  var chart = categories.length <= 5 ? few : many;
  chart(categories, g, width, height);
};

