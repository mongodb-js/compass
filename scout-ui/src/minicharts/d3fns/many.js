var d3 = require('d3');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minicharts:many');

require('d3-tip')(d3);

module.exports = function (data, g, width, height, labels) {

  var x = d3.scale.ordinal()
    .domain(_.pluck(data, 'x'))
    .rangeBands([0, width], 0.3, 0.0);

  var y = d3.scale.linear()
    .domain([0, d3.max(_.pluck(data, 'y'))])
    .range([height, 0]);

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d, i) {
      if (typeof d.tooltip === 'function') {
        return d.tooltip(d, i);
      }
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
      return 'translate(' + x(d.x) + ', 0)';
    });

  bar.append('rect')
    .attr('class', 'bg')
    .attr('width', x.rangeBand())
    .attr('height', height);

  bar.append('rect')
    .attr('class', 'fg')
    .attr('x', 0)
    .attr('y', function(d) {
      return y(d.y);
    })
    .attr('width', x.rangeBand())
    .attr('height', function(d) {
      return height - y(d.y);
    });

    bar.append('rect')
      .attr('class', 'glass')
      .attr('width', x.rangeBand())
      .attr('height', height)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);

    if (labels) {

      _.defaults(labels, {
        'x': labels['text-anchor'] === 'middle' ? x.rangeBand() / 2 : function (d, i) {
          if (i === 0) return 0;
          if (i === data.length - 1) return x.rangeBand();
          return x.rangeBand() / 2;
        },
        'y': height+5,
        'dy': '0.75em',
        'text-anchor': function (d, i) {
          if (i === 0) return 'start';
          if (i === data.length - 1) return 'end';
          return 'middle';
        },
        'text': function (d) {
          return d.x;
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
