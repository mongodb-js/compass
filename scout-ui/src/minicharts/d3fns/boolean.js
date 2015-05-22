var d3 = require('d3');
var _ = require('lodash');
var few = require('./few');
var shared = require('./shared');
var debug = require('debug')('scout-ui:minicharts:boolean');

module.exports = function(opts) {
  var values = opts.data.values.toJSON();

  // group by true/false
  var data = _(values)
    .groupBy(function(d) {
      // extract string representations of values
      return d;
    })
    .defaults({
      false: [],
      true: []
    })
    .map(function(v, k) {
      return {
        label: k,
        value: v.length
      };
    })
    .sortByOrder('label', [false]) // order: false, true
    .value();

  var margin = shared.margin;

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

