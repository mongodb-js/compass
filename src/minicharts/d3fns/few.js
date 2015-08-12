var d3 = require('d3');
var _ = require('lodash');
var $ = require('jquery');
var tooltipHtml = require('./tooltip.jade');
var shared = require('./shared');

require('../d3-tip')(d3);

module.exports = function(data, view, g, width, height) {
  var handleClick = function(d, i) {
    var fgRect = $(this).siblings('rect.fg')[0];
    var evt = {
      d: d,
      i: i,
      self: fgRect,
      all: view.queryAll('rect.fg'),
      evt: d3.event,
      type: 'click',
      source: 'few'
    };
    view.trigger('querybuilder', evt);
  };

  var barHeight = 25;
  var values = _.pluck(data, 'count');
  var sumValues = d3.sum(values);
  var maxValue = d3.max(values);
  var percentFormat = shared.friendlyPercentFormat(maxValue / sumValues * 100);

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
          label: shared.truncateTooltip(d.label),
          count: percentFormat(d.count / sumValues * 100, false)
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
        .pluck('count')
        .value()
      );
      return 'translate(' + x(xpos) + ', ' + (height - barHeight) / 2 + ')';
    });

  bar.append('rect')
    .attr('class', function(d, i) {
      return 'fg fg-' + i;
    })
    .attr('y', 0)
    .attr('x', 0)
    .attr('width', function(d) {
      return x(d.count);
    })
    .attr('height', barHeight);

  bar.append('text')
    .attr('y', barHeight / 2)
    .attr('dy', '0.3em')
    .attr('dx', 10)
    .attr('text-anchor', 'start')
    .text(function(d) {
      return d.label;
    })
    .attr('fill', 'white');

  bar.append('rect')
    .attr('class', 'glass')
    .attr('y', 0)
    .attr('x', 0)
    .attr('width', function(d) {
      return x(d.count);
    })
    .attr('height', barHeight)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .on('click', handleClick);
};
