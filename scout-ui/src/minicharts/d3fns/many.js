var d3 = require('d3');
var _ = require('lodash');
var tooltipHtml = require('./tooltip.jade');
var debug = require('debug')('scout-ui:minicharts:many');

require('d3-tip')(d3);

module.exports = function(data, g, width, height, options) {

  // if legend present, save some space
  var legendWidth = 40;

  options = _.defaults(options || {}, {
    bgbars: false,
    legend: false,
    labels: false // label defaults will be set further below
  });

  if (options.legend) {
    width = width - legendWidth;
  }

  var x = d3.scale.ordinal()
    .domain(_.pluck(data, 'label'))
    .rangeBands([0, width], 0.3, 0.0);

  var values = _.pluck(data, 'value');

  var y = d3.scale.linear()
    .domain([0, d3.max(values)])
    .range([height, 0]);

  var sumY = d3.sum(values);

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d, i) {
      if (typeof d.tooltip === 'function') {
        return d.tooltip(d, i);
      }
      return d.tooltip || tooltipHtml({
          label: d.label,
          value: d.value
        });
    })
    .direction('n')
    .offset([-9, 0]);

  // clear element first
  g.selectAll('*').remove();
  g.call(tip);

  if (options.legend) {

    var maxVal = d3.max(y.domain());
    var format = d3.format('%.1f');
    var legendValues = [format(maxVal), format(maxVal / 2)];

    // @todo use a scale and wrap both text and line in g element
    var legend = g.append('g')
      .attr('class', 'legend');

    legend.append('text')
      .attr('class', 'legend')
      .attr('x', width)
      .attr('dx', '1em')
      .attr('y', 0)
      .attr('dy', '0.3em')
      .attr('text-anchor', 'start')
      .text(d3.max(y.domain()) + '%');

    legend.append('text')
      .attr('class', 'legend')
      .attr('x', width)
      .attr('dx', '1em')
      .attr('y', height / 2)
      .attr('dy', '0.3em')
      .attr('text-anchor', 'start')
      .text(d3.max(y.domain()) / 2 + '%');

    legend.append('text')
      .attr('class', 'legend')
      .attr('x', width)
      .attr('dx', '1em')
      .attr('y', height)
      .attr('dy', '0.3em')
      .attr('text-anchor', 'start')
      .text('0%');

    legend.append('line')
      .attr('class', 'bg legend')
      .attr('x1', 0)
      .attr('x2', width + 5)
      .attr('y1', 0)
      .attr('y2', 0);

    legend.append('line')
      .attr('class', 'bg legend')
      .attr('x1', 0)
      .attr('x2', width + 5)
      .attr('y1', height / 2)
      .attr('y2', height / 2);

    legend.append('line')
      .attr('class', 'bg legend')
      .attr('x1', 0)
      .attr('x2', width + 5)
      .attr('y1', height)
      .attr('y2', height);
  }


  var bar = g.selectAll('.bar')
    .data(data)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', function(d) {
      return 'translate(' + x(d.label) + ', 0)';
    });

  if (options.bgbars) {
    bar.append('rect')
      .attr('class', 'bg')
      .attr('width', x.rangeBand())
      .attr('height', height);
  }

  var fgbars = bar.append('rect')
    .attr('class', 'fg')
    .attr('x', 0)
    .attr('y', function(d) {
      return y(d.value);
    })
    .attr('width', x.rangeBand())
    .attr('height', function(d) {
      return height - y(d.value);
    });

  if (options.bgbars) {
    bar.append('rect')
      .attr('class', 'glass')
      .attr('width', x.rangeBand())
      .attr('height', height)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);
  } else {
    // atach tooltips directly to foreground bars
    fgbars
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);
  }

  if (options.labels) {
    var labels = options.labels;
    _.defaults(labels, {
      'x': labels['text-anchor'] === 'middle' ? x.rangeBand() / 2 : function(d, i) {
        if (i === 0) return 0;
        if (i === data.length - 1) return x.rangeBand();
        return x.rangeBand() / 2;
      },
      'y': height + 5,
      'dy': '0.75em',
      'text-anchor': function(d, i) {
        if (i === 0) return 'start';
        if (i === data.length - 1) return 'end';
        return 'middle';
      },
      'text': function(d) {
        return d.value;
      }
    });

    bar.append('text')
      .attr('x', labels.x)
      .attr('dx', labels.dx)
      .attr('y', labels.y)
      .attr('dy', labels.dy)
      .attr('text-anchor', labels['text-anchor'])
      .text(labels.text);
  }
};
