var d3 = require('d3');
var _ = require('lodash');
var few = require('./few');
var shared = require('./shared');

var minicharts_d3fns_boolean = function(opts) {
  var values = opts.model.values.toJSON();

  // group by true/false
  var data = _(values)
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

  var margin = shared.margin;

  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  // clear el first
  d3.select(el).selectAll('*').remove();

  var g = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  few(data, opts.view, g, width, height);
};

module.exports = minicharts_d3fns_boolean;
