var d3 = require('d3');
var _ = require('lodash');
var few = require('./few');
var debug = require('debug')('scout-ui:minicharts:boolean');

module.exports = function(opts) {
  var values = opts.data;

  // group by true/false
  var data = _(values)
  .groupBy(function(d) {
    return d;
  })
  .defaults({false: [], true: []})
  .map(function(v, k) {
    return {
      x: k,
      y: v.length,
      tooltip: k
    };
  })
  .sortByOrder('x', [false]) // descending on y
  .value();

  var margin = {
    top: 10,
    right: 0,
    bottom: 10,
    left: 0
  };

  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  // clear el first
  d3.select(el).selectAll('*').remove();

  var g = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  few(data, g, width, height);
};

