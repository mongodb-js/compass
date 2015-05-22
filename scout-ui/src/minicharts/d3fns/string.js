var d3 = require('d3');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minicharts:string');
var few = require('./few');
var many = require('./many');
var shared = require('./shared');

module.exports = function(opts) {
  var values = opts.data.values.toJSON();

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
        value: v.length
      };
    })
    .sortByOrder('value', [false]) // descending on value
    .value();

  // clear element first
  d3.select(el).selectAll('*').remove();

  var g = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('width', width)
    .attr('height', height);

  var chart = data.length <= 5 ? few : many;
  chart(data, g, width, height, {
    scale: true,
    bglines: true
  });
};

