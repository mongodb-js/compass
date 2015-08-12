var d3 = require('d3');
var _ = require('lodash');
var tooltipHtml = require('./tooltip.jade');
var shared = require('./shared');

require('../d3-tip')(d3);

var minicharts_d3fns_many = function(data, view, g, width, height, options) {
  var handleClick = function(d, i) {
    var evt = {
      d: d,
      i: i,
      self: this,
      all: view.queryAll('rect.fg'),
      evt: d3.event,
      type: 'click',
      source: 'many'
    };
    view.trigger('querybuilder', evt);
  };

  options = _.defaults(options || {}, {
    bgbars: false,
    scale: false,
    labels: false // label defaults will be set further below
  });

  var x = d3.scale.ordinal()
    .domain(_.pluck(data, 'label'))
    .rangeBands([0, width], 0.3, 0.0);

  var values = _.pluck(data, 'count');
  var maxValue = d3.max(values);
  var sumValues = d3.sum(values);
  var percentFormat = shared.friendlyPercentFormat(maxValue / sumValues * 100);

  var y = d3.scale.linear()
    .domain([0, maxValue])
    .range([height, 0]);

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

  if (options.scale) {
    var triples = function(v) {
      return [v, v / 2, 0];
    };

    var scaleLabels = _.map(triples(maxValue / sumValues * 100), function(x) {
      return percentFormat(x, true);
    });
    var labelScale = d3.scale.ordinal()
      .domain(scaleLabels)
      .rangePoints([0, height]);

    // @todo use a scale and wrap both text and line in g element
    var legend = g.selectAll('.legend')
      .data(scaleLabels)
      .enter().append('g')
      .attr('class', 'legend');

    legend
      .append('text')
      .attr('x', 0)
      .attr('dx', '-1em')
      .attr('y', function(d) {
        return labelScale(d);
      })
      .attr('dy', '0.3em')
      .attr('text-anchor', 'end')
      .text(function(d) {
        return d;
      });

    legend.append('line')
      .attr('class', 'bg legend')
      .attr('x1', -5)
      .attr('x2', width)
      .attr('y1', function(d) {
        return labelScale(d);
      })
      .attr('y2', function(d) {
        return labelScale(d);
      });
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
      return y(d.count);
    })
    .attr('width', x.rangeBand())
    .attr('height', function(d) {
      return height - y(d.count);
    });

  if (options.bgbars) {
    bar.append('rect')
      .attr('class', 'glass')
      .attr('width', x.rangeBand())
      .attr('height', height)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .on('click', handleClick);
  } else {
    // atach tooltips directly to foreground bars
    fgbars
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide)
      .on('click', handleClick);
  }

  if (options.labels) {
    var labels = options.labels;
    _.defaults(labels, {
      x: labels['text-anchor'] === 'middle' ? x.rangeBand() / 2 : function(d, i) {
        if (i === 0) return 0;
        if (i === data.length - 1) return x.rangeBand();
        return x.rangeBand() / 2;
      },
      y: height + 5,
      dy: '0.75em',
      'text-anchor': function(d, i) {
        if (i === 0) return 'start';
        if (i === data.length - 1) return 'end';
        return 'middle';
      },
      text: function(d) {
        return d.count;
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
module.exports = minicharts_d3fns_many;
