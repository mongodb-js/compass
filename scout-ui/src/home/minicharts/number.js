var d3 = require('d3');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minichart-number');

require('d3-tip')(d3);

/**
 * helper function to move an element to the front
 */
d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

module.exports = function(opts) {
  var values = opts.data;

  // A formatter for counts.
  var formatCount = d3.format(',.0f');

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
      return d.x + '-' + (d.x + d.dx);
    })
    .direction('n')
    .offset([-9, 0]);

  var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  };

  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  var x = d3.scale.linear()
    .domain(d3.extent(values))
    .range([0, width]);

  var ticks = x.ticks(20);

  // Generate a histogram using approx. twenty uniformly-spaced bins
  var hist = d3.layout.histogram()
    .bins(ticks);

  var data = hist(values);

  // now that we know #bins, make x ordinal
  x = d3.scale.ordinal()
    .domain(_.pluck(data, 'x'))
    .rangeBands([0, width], 0.3, 0.0);

  var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) {
        return d.y;
    })])
    .range([height, 0]);

  // clear element first
  d3.select(el).selectAll('*').remove();

  var svg = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .call(tip);

  var bar = svg.selectAll('.bar')
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
    })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

  // bar.append('text')
  //   .attr('dy', '.75em')
  //   .attr('y', function(d) {
  //     return height - y(d.y) + 5;
  //   })
  //   .attr('x', barWidth / 2)
  //   .attr('text-anchor', 'middle')
  //   .text(function(d) {
  //     return formatCount(d.x);
  //   });
};

