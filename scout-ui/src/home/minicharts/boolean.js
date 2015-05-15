var d3 = require('d3');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minichart-boolean');

module.exports = function(opts) {
  var values = opts.data;

  // group by true/false
  var data = _.groupBy(values, function(v) {
    return v;
  });
  data = [data[false] ? data[false].length : 0, data[true] ? data[true].length : 0];

  var margin = {
    top: 10,
    right: 0,
    bottom: 10,
    left: 0
  };

  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var barOffset = 50;

  var el = opts.el;

  var x = d3.scale.linear()
    .domain([0, d3.max(data)])
    .range([0, width - barOffset]);

  // clear el first
  d3.select(el).selectAll('*').remove();

  var svg = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var bar = svg.selectAll('bar')
    .data(data)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', function(d, i) {
      return 'translate(' + barOffset + ', ' + i * height / 3 + ')';
    });

  bar.append('rect')
    .attr('class', 'bg')
    .attr('x', 0)
    .attr('width', width - barOffset)
    .attr('height', 10);

  bar.append('rect')
    .attr('class', 'fg')
    .attr('x', 0)
    .attr('width', function(d) {
      return x(d);
    })
    .attr('height', 10);

  bar.append('text')
    .attr('dx', '-1em')
    .attr('dy', '0.75em')
    .attr('y', 0)
    .attr('x', 0)
    .attr('text-anchor', 'end')
    .text(function(d, i) {
      return i ? 'true' : 'false';
    });
};

