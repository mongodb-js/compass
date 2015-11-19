var d3 = require('d3');
var _ = require('lodash');
var shared = require('./shared');
var tooltipHtml = require('./tooltip.jade');

require('../d3-tip')(d3);

// var debug = require('debug')('scout:minicharts:coordinates');

var minicharts_d3fns_coordinates = function() {
  // --- beginning chart setup ---
  var width = 400;
  var height = 100;
  var options = {
    view: null
  };
  var margin = shared.margin;
  margin.bottom = 20;

  var xScale = d3.scale.linear();
  var yScale = d3.scale.linear();

  var xAxis = d3.svg.axis()
    .ticks(10)
    .scale(xScale)
    .orient('bottom');

  var yAxis = d3.svg.axis()
    .ticks(6)
    .scale(yScale)
    .orient('left');

  var coordFormat = d3.format('.1f');

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('n')
    .offset([-9, 0]);

  // --- end chart setup ---

  function chart(selection) {
    selection.each(function(data) {
      var el = d3.select(this);
      var innerWidth = width - margin.left - margin.right;
      var innerHeight = height - margin.top - margin.bottom;

      // setup tool tips
      tip.html(function(d) {
        return tooltipHtml({
          label: 'lng: ' + coordFormat(d[0]) + ', lat: ' + coordFormat(d[1])
        });
      });
      el.call(tip);

      xScale
        .domain([
          d3.min(data, function(d) {
            return d[0];
          }) - 3,
          d3.max(data, function(d) {
            return d[0];
          }) + 3
        ])
        .range([0, innerWidth]);

      yScale
        .domain([
          d3.min(data, function(d) {
            return d[1];
          }) - 3,
          d3.max(data, function(d) {
            return d[1];
          }) + 3
        ])
        .range([innerHeight, 0]);

      var g = el.selectAll('g').data([null]);

      // append g element if it doesn't exist yet
      g.enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', innerWidth)
        .attr('height', innerHeight);

      var x = g.selectAll('.x.axis').data([null]);
      x.enter().append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0, ' + innerHeight + ')')
        .append('text')
        // .attr('class', 'label')
        .attr('x', innerWidth)
        .attr('y', -6)
        .style('text-anchor', 'end')
        .text('lng');
      x.call(xAxis);

      var y = g.selectAll('.y.axis').data([null]);
      y.enter().append('g')
        .attr('class', 'y axis')
        .append('text')
        // .attr('class', 'label')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '.71em')
        .style('text-anchor', 'end')
        .text('lat');
      y.call(yAxis);

      // select all g.bar elements
      var circle = g.selectAll('circle.circle')
        .data(data);

      circle
        .transition() // only apply transition to already existing elements
        .attr('cx', function(d) {
          return xScale(d[0]);
        })
        .attr('cy', function(d) {
          return yScale(d[1]);
        });

      circle.enter().append('circle')
        .attr('class', 'circle')
        .attr('cx', function(d) {
          return xScale(d[0]);
        })
        .attr('cy', function(d) {
          return yScale(d[1]);
        })
        .attr('r', 4.5)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

      circle.exit().remove();
    });
  }

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value;
    return chart;
  };

  chart.options = function(value) {
    if (!arguments.length) {
      return options;
    }
    _.assign(options, value);
    return chart;
  };

  return chart;
};

module.exports = minicharts_d3fns_coordinates;
