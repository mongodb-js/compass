var d3 = require('d3');
var _ = require('lodash');
var tooltipHtml = require('./tooltip.jade');
var debug = require('debug')('scout-ui:minicharts:few');

require('d3-tip')(d3);

module.exports = function(data, g, width, height, options) {

  var barHeight = 25;
  var values = _.pluck(data, 'value');
  var sumValues = d3.sum(values);

  // data.x is still the label, and data.y the length of the bar
  var x = d3.scale.linear()
    .domain([0, sumValues])
    .range([0, width]);

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d, i) {
      if (typeof d.tooltip === 'function') {
        return d.tooltip(d, i);
      }
      return d.tooltip || tooltipHtml({
          label: d.label,
          value: Math.round(d.value / sumValues * 100)
        });
    })
    .direction('n')
    .offset([-9, 0]);

  // clear element first
  g.selectAll('*').remove();
  g.call(tip);

  var bar = g.selectAll('.bar')
    .data(data)
    .enter().append('g')
    .attr('class', 'bar few')
    .attr('transform', function(d, i) {

      var xpos = _.sum(_(data)
        .slice(0, i)
        .pluck('value')
        .value()
      );
      return 'translate(' + x(xpos) + ', ' + (height - barHeight) / 2 + ')';
    });

  bar.append('rect')
    .attr('class', function(d, i) {
      return 'fg-' + i;
    })
    .attr('y', 0)
    .attr('x', 0)
    .attr('width', function(d) {
      return x(d.value);
    })
    .attr('height', barHeight)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

  bar.append('text')
    .attr('y', barHeight / 2)
    .attr('dy', '0.3em')
    .attr('dx', 10)
    .attr('text-anchor', 'start')
    .text(function(d) {
      return d.label;
    })
    .attr('fill', 'white');

};
