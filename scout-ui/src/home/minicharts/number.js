var d3 = require('d3');
var debug = require('debug')('scout-ui:minichart-number');

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

  // minor adjustment of width to line up nicely with number of bins
  var barGap = 5;
  var barWidth = Math.floor(width / data.length) - barGap;
  width = (barWidth + barGap) * data.length;
  x.range([0, width]);

  var y = d3.scale.linear()
    .domain([0, d3.max(data, function(d) {
        return d.y;
    })])
    .range([height, 0]);

  // clear element first
  d3.select(el).selectAll('*').remove();

  var svg = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var bar = svg.selectAll('.bar')
    .data(data)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', function(d, i) {
      return 'translate(' + (barWidth + barGap) * i + ',' + y(d.y) + ')';
    });

  bar.append('rect')
    .attr('class', 'bg')
    .attr('x', 0)
    .attr('width', barWidth)
    .attr('height', height)
    .attr('transform', function(d) {
      return 'translate(0, ' + -y(d.y) + ')';
    });

  bar.append('rect')
    .attr('class', 'fg')
    .attr('x', 0)
    .attr('width', barWidth)
    .attr('height', function(d) {
      return height - y(d.y);
    });

  bar.append('text')
    .attr('dy', '.75em')
    .attr('y', function(d) {
      return height - y(d.y) + 5;
    })
    .attr('x', barWidth / 2)
    .attr('text-anchor', 'middle')
    .text(function(d) {
      return formatCount(d.x);
    });
};

