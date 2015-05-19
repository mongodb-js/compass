var d3 = require('d3');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minicharts:few');

require('d3-tip')(d3);

module.exports = function (data, g, width, height) {
  // @todo make barOffset equal to longest label
  var barOffset = width / 4;

  // data.x is still the label, and data.y the length of the bar
  var x = d3.scale.linear()
    .domain([0, d3.max(_.pluck(data, 'y'))])
    .range([0, width - barOffset]);

  var y = d3.scale.ordinal()
    .domain(_.pluck(data, 'x'))
    .rangeBands([0, height], 0.3, 0.0);

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
      return d.tooltip || d.x;
    })
    .direction('n')
    .offset([-9, 0]);

  // clear element first
  g.selectAll('*').remove();
  g.call(tip);

  var bar = g.selectAll('.bar')
    .data(data)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', function(d) {
      return 'translate(0, ' + y(d.x)  + ')';
    });

  bar.append('rect')
    .attr('class', 'bg')
    .attr('x', barOffset)
    .attr('width', width - barOffset)
    .attr('height', y.rangeBand());

  bar.append('rect')
    .attr('class', 'fg')
    .attr('y', 0)
    .attr('x', barOffset)
    .attr('width', function(d) {
      return x(d.y);
    })
    .attr('height', y.rangeBand());

  bar.append('rect')
    .attr('class', 'glass')
    .attr('x', barOffset)
    .attr('width', width - barOffset)
    .attr('height', y.rangeBand())
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

  bar.append('text')
    .attr('dx', '-10')
    .attr('dy', '0.4em')
    .attr('y', y.rangeBand() / 2)
    .attr('x', barOffset)
    .attr('text-anchor', 'end')
    .text(function(d) {
      return d.x;
    });

};
