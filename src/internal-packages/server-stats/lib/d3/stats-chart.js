const d3 = require('d3');
const debug = require('debug')('server-stats:stats-chart');

const graphfunction = function() {
  'use strict';
  var width = 600;
  var height = 300;
  var x = d3.time.scale();
  var y = d3.scale.linear();
  var y2 = d3.scale.linear();
  var yAxis = d3.svg.axis().scale(y).orient('left').ticks(0);
  var xAxis = d3.svg.axis().scale(x).orient('bottom').ticks(0);
  var keys = [];
  var onOverlay = false;
  var mouseLocation = null;
  var bubbleWidth = 10;
  var margin = {top: 60, right: 30, bottom: 50, left: 40};
  var subHeight = height - margin.top - margin.bottom;
  var subWidth = width - margin.left - margin.right;

  function drawError() {
    var message = 'Error: bad data given to graph.';
    var container = d3.select(this);
    var g = container.selectAll('g.chart').data([0]);
    g.enter()
      .append('g')
      .attr('class', 'chart')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .append('text')
      .attr('class', 'error-message')
      .attr('x', (subWidth / 2))
      .attr('y', (subHeight / 2))
      .text(message);
  }

  function chart(selection) {
    selection.each(function(data) {
      // Handle bad data
      if (!('localTime' in data) || data.localTime.length === 0) { // TODO: handle more types of bad data
        return drawError();
      }

      // Create chart
      var container = d3.select(this);
      var g = container.selectAll('g.chart').data([0]);
      var gEnter = g.enter()
        .append('g')
        .attr('class', 'chart')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // Setup
      keys = data.dataSets.map(function(f) { return f.line; });
      var minTime = data.localTime[data.localTime.length - 1];
      minTime = new Date(minTime.getTime() - (data.xLength * 1000));
      var xDomain = d3.extent([minTime].concat(data.localTime));
      var subMargin = {left: (subWidth / 60) * (data.xLength - 60), top: 10};
      var currSelection;
      var legendWidth = (subWidth - subMargin.top) / data.numKeys;
      var scale2 = 'secondScale' in data;
      if (scale2) {
        keys.push(data.secondScale.line);
      }

      x
        .domain(xDomain)
        .range([0, subWidth]);
      y
        .domain(data.yDomain)
        .range([subHeight, 0]);
      var timeZero = x.invert(subMargin.left);

      // Title
      gEnter
        .append('text')
        .attr('class', 'chart-title')
        .attr('x', (subWidth / 2))
        .attr('y', 0 - (margin.top / 2))
        .text(data.labels.title);

      // Axes
      gEnter
        .append('g')
        .attr('class', 'axis-x')
        .attr('transform', 'translate(0,' + subHeight + ')')
        .call(d3.svg.axis().scale(x).orient('bottom'));
      d3.selectAll('.axis-x').call(xAxis);
      gEnter
        .append('g')
        .attr('class', 'axis-y')
        .call(d3.svg.axis().scale(y).orient('left'));
      d3.selectAll('.axis-y').call(yAxis);

      // Axis labels
      currSelection = gEnter
        .append('g')
        .attr('class', 'axis-labels');
      [{
        name: 'y-label text-units',
        x: subMargin.left - 15, y: 15,
        default: data.labels.yAxis
      }, {
        name: 'y-label text-count',
        x: subMargin.left - 15, y: 5,
        default: ''
      }, {
        name: 'x-label min',
        x: (x.range()[0] + subMargin.left), y: (-subMargin.top - 5),
        default: ''
      }, {
        name: 'x-label max',
        x: x.range()[1], y: (-subMargin.top - 5),
        default: ''
      }].map(function(c) {
        currSelection
          .append('text')
          .attr('class', c.name)
          .attr('transform', 'translate(' + c.x + ',' + c.y + ')')
          .text(c.default);
      });
      container.selectAll('text.text-count')
        .text(d3.format('s')(data.yDomain[1]));
      container.selectAll('text.max')
        .text(d3.time.format('%X')(xDomain[1]));
      container.selectAll('text.min')
        .text(d3.time.format('%X')(timeZero));

      // Second scale axis label
      if (scale2) {
        currSelection
          .append('text')
          .attr('class', 'y-label second-label')
          .attr('transform', 'translate(' + (subWidth + 5) + ',5)');
        container.selectAll('text.second-label')
          .text(d3.format('s')(data.secondScale.currentMax)); // in case its really large
      }

      // Border Lines
      currSelection = gEnter
        .append('g')
        .attr('class', 'background-lines');
      [{
        x1: x.range()[0] + subMargin.left, y1: y.range()[0],
        x2: x.range()[0] + subMargin.left, y2: y.range()[1] - subMargin.top,
        class: 'left'
      }, {
        x1: x.range()[1], y1: y.range()[0],
        x2: x.range()[1], y2: y.range()[1] - subMargin.top,
        class: 'right'
      }, {
        x1: x.range()[0] + subMargin.left, y1: y.range()[0],
        x2: x.range()[1], y2: y.range()[0],
        class: 'bottom'
      }, {
        x1: x.range()[0] + subMargin.left - subMargin.top, y1: y.range()[1],
        x2: x.range()[1], y2: y.range()[1],
        class: 'top'
      }, {
        x1: x.range()[0] + subMargin.left, y1: (y.range()[0] / 2),
        x2: x.range()[1], y2: (y.range()[0] / 2),
        class: 'middle'
      }].map(function(c) {
        currSelection
          .append('line')
          .attr('class', c.class)
          .attr('x1', c.x1).attr('y1', c.y1)
          .attr('x2', c.x2).attr('y2', c.y2);
      });

      // Chart Lines
      var line = d3.svg.line()
        .interpolate('monotone')
        .x(function(d, i) { return x(data.localTime[i]); })
        .y(function(d) { return y(d); });
      g.selectAll('.line-div').data(data.dataSets)
        .enter().append('g')
        .attr('class', 'line-div')
        .append('path')
        .attr('class', function(d, i) { return 'line chart-color-' + i; })
        .style('fill', 'none')
        .attr('id', function(d) { return 'tag' + d.line; } );
      container.selectAll('path.line')
        .attr('d', function(d) { return line(d.count); });

      // Add line with different scale
      if (scale2) {
        y2
          .domain([0, data.secondScale.currentMax])
          .range([subHeight, 0]);
        var line2 = d3.svg.line()
          .interpolate('monotone')
          .x(function(d, i) { return x(data.localTime[i]); })
          .y(function(d) { return y2(d); });
        g.selectAll('.second-line-div').data([data.secondScale])
          .enter().append('g')
          .attr('class', 'second-line-div')
          .append('path')
          .attr('class', 'second-line chart-color-' + (keys.length - 1))
          .style('fill', 'none')
          .attr('id', function (d) { return 'tag' + d.line; });
        container.selectAll('.second-line')
          .attr('d', function(d) { return line2(d.count); });
      }

      // Legend
      var l = container.selectAll('g.legend').data([0]);
      var mLeft = margin.left + subMargin.left;
      var mRight = subHeight + margin.top + subMargin.top;
      var lEnter = l.enter()
        .append('g')
        .attr('class', 'legend')
        .attr('width', subWidth)
        .attr('height', margin.bottom)
        .attr('transform', 'translate(' + mLeft + ',' + mRight + ')');

      var legendDiv = lEnter.selectAll('.legend').data(keys).enter()
        .append('g')
        .attr('class', 'subLegend')
        .attr('transform', function(d, i) {
          if (scale2 && i === (keys.length - 1)) { // Set location if on separate axis.
            return 'translate(' + (subWidth - 120) + ',5)';
          } else {
            return 'translate(' + (i * legendWidth) + ',5)';
          }
        });
      legendDiv
        .append('rect')
        .attr('class', function(d, i) { return 'legend-box chart-color-' + i; })
        .attr('id', function(d) { return 'box' + d; })
        .attr('width', bubbleWidth)
        .attr('height', bubbleWidth)
        .attr('rx', bubbleWidth / 5)
        .attr('ry', bubbleWidth / 5)

        .on('click', function(d, i) {
          var currLine;
          if (i >= data.dataSets.length && scale2) {
            currLine = data.secondScale;
          } else {
            currLine = data.dataSets[i];
          }
          var active = currLine.active ? false : true;
          var newOpacity = active ? 1 : 0;
          d3.select('#tag' + d)
            .transition().duration(100)
            .style('opacity', newOpacity);
          d3.select('#box' + d)
            .transition().duration(100)
            .style('fill-opacity', newOpacity);
          d3.select('#bubble' + d)
            .transition().duration(100)
            .style('opacity', newOpacity);
          currLine.active = active;
        });
      legendDiv
        .append('text')
        .attr('class', 'legend-linename')
        .attr('transform', 'translate(' + 13 + ',9)')
        .text(function(d, i) {return data.labels.keys[i]; });
      legendDiv
        .append('text')
        .attr('class', function(d) { return 'legend-count text-' + d;} )
        .attr('transform', 'translate(' + 15 + ',25)');

      // Create overlay line + bubbles
      var focus = container.selectAll('g.focus').data([0]).enter()
        .append('g')
        .attr('class', 'focus')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .style('display', 'none');
      focus.append('line')
        .attr('class', 'overlay-line')
        .attr('transform', 'translate(' + subWidth + ',0)')
        .attr('x1', x.range()[0]).attr('y1', y.range()[0])
        .attr('x2', x.range()[0]).attr('y2', y.range()[1]);
      focus.append('path')
        .attr('class', 'overlay-triangle')
        .attr('transform', 'translate(' + subWidth + ',0)')
        .attr('d', d3.svg.symbol().type('triangle-down'));
      focus.append('text')
        .attr('class', 'overlay-date')
        .attr('transform', 'translate(' + subWidth + ',0)');
      focus.selectAll('.focus').data(keys).enter()
        .append('rect')
        .attr('class', function(d, i) { return 'overlay-bubbles chart-color-' + i; })
        .attr('id', function(d) { return 'bubble' + d; })
        .attr('width', bubbleWidth)
        .attr('height', bubbleWidth)
        .attr('rx', bubbleWidth / 5)
        .attr('ry', bubbleWidth / 5);

      // Transform overlay elements to current selection
      function updateOverlay() {
        var bisectDate = d3.bisector(function(d) {
          return d;
        }).left;
        var index = bisectDate(data.localTime, x.invert(mouseLocation), 1);
        if (index >= data.localTime.length) {
          return;
        }
        var leftOffset = x(data.localTime[index]);
        focus = container.selectAll('g.focus');
        focus.selectAll('line.overlay-line')
          .attr('transform', 'translate(' + leftOffset + ',0)');
        focus.selectAll('path.overlay-triangle')
          .attr('transform', 'translate(' + leftOffset + ',-5)');
        focus.selectAll('text.overlay-date')
          .attr('transform', 'translate(' + leftOffset + ',-15)')
          .text(d3.time.format('%X')(data.localTime[index]));
        var key;
        var rightOffset;
        var lM;
        var rM;
        var currentText;
        for (var k = 0; k < data.dataSets.length; k++) {
          key = data.dataSets[k];
          rightOffset = y(key.count[index]);
          lM = leftOffset - (bubbleWidth / 2);
          rM = rightOffset - (bubbleWidth / 2);
          focus.selectAll('rect.chart-color-' + k)
            .attr('transform', 'translate(' + lM + ',' + rM + ')');
          currentText = container.selectAll('text.legend-count.text-' + key.line);
          currentText.text(data.rawData[index][key.line]);
        }
        // Update overlay for line on separate scale
        if (scale2) {
          rightOffset = y2(data.secondScale.count[index]);
          lM = leftOffset - (bubbleWidth / 2);
          rM = rightOffset - (bubbleWidth / 2);
          focus.selectAll('rect.chart-color-' + (keys.length - 1))
            .attr('transform', 'translate(' + lM + ',' + rM + ')');
          var currentText = container.selectAll('text.legend-count.text-' + data.secondScale.line);
          currentText.text(data.rawData[index][data.secondScale.line]);
        }
      }

      // Set overlays to visible and update current selection
      function mouseMove() {
        mouseLocation = d3.mouse(this)[0];
        updateOverlay();
      }

      // Bind overlay updating function to mouse movements over the chart
      container.selectAll('rect.overlay').data([0]).enter()
        .append('rect')
        .attr('class', 'overlay')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', subWidth)
        .attr('height', subHeight)
        .style('opacity', 0)
        .on('mouseover', function() {
          onOverlay = true;
          focus.style('display', null);
        })
        .on('mouseout', function() {
          onOverlay = false;
          focus.style('display', 'none');
        })
        .on('mousemove', mouseMove);

      if (onOverlay) {
        updateOverlay();
      } else {
        container.selectAll('text.legend-count')
          .text(function(d) {
            return data.rawData[data.rawData.length - 1][d];
          });
      }
    });
  }
  // Configuration Getters & Setters
  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return this;
  };
  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return this;
  };
  return chart;
};
module.exports = graphfunction;
