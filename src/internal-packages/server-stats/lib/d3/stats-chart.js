const d3 = require('d3');
const debug = require('debug')('mongodb-compass:server-stats-chart');

const graphfunction = function() {
  var width = 600;
  var height = 300;
  var x = d3.time.scale();
  var y = d3.scale.linear();
  var y2 = d3.scale.linear();
  var keys = [];
  var onOverlay = false;
  var mouseLocation = null;
  var bubbleWidth = 10;
  var margin = {top: 80, right: 30, bottom: 80, left: 40};
  var subHeight = height - margin.top - margin.bottom;
  var subWidth = width - margin.left - margin.right;
  var subMargin = {top: 10, left: (subWidth / 60) * 3};

  function validate(data) {
    var topKeys = ['dataSets', 'localTime', 'yDomain', 'xLength',
      'labels', 'keyLength'];
    for (var i = 0; i < topKeys.length; i++) {
      if (!(topKeys[i] in data)) {
        return false;
      }
    }
    var len = data.dataSets.length;
    if ('secondScale' in data) {
      if (!('line' in data.secondScale && 'count' in data.secondScale && 'active' in data.secondScale) ||
          data.secondScale.count.length !== data.localTime.length) {
        return false;
      }
      len++;
    }
    if (data.localTime.length === 0 ||
        data.yDomain.length !== 2 || data.yDomain[0] >= data.yDomain[1] ||
        !('keys' in data.labels) || data.labels.keys.length !== len) {
      return false;
    }
    for (var i = 0; i < data.dataSets.length; i++) {
      if (!('line' in data.dataSets[i] && 'count' in data.dataSets[i] && 'active' in data.dataSets[i]) ||
          data.dataSets[i].count.length !== data.localTime.length) {
        return false;
      }
    }
    return true;
  }

  function chart(selection) {
    selection.each(function(data) {
      // Create chart
      var container = d3.select(this);
      var g = container.selectAll('g.chart').data([0]);
      var gEnter = g.enter()
        .append('g')
        .attr('class', 'chart')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // Title
      gEnter
        .append('text')
        .attr('class', 'chart-title')
        .attr('x', (subWidth / 2))
        .attr('y', 0 - (margin.top / 2));
      if ('labels' in data && 'title' in data.labels) {
        g.selectAll('text.chart-title')
          .text(data.labels.title);
      }

      // Border Lines
      var currSelection = gEnter
        .append('g')
        .attr('class', 'background-lines');
      [{
        x1: 0 + subMargin.left, y1: subHeight,
        x2: 0 + subMargin.left, y2: 0 - subMargin.top,
        class: 'left'
      }, {
        x1: subWidth, y1: subHeight,
        x2: subWidth, y2: 0 - subMargin.top,
        class: 'right'
      }, {
        x1: 0 + subMargin.left, y1: subHeight,
        x2: subWidth, y2: subHeight,
        class: 'bottom'
      }, {
        x1: 0 + subMargin.left - subMargin.top, y1: 0,
        x2: subWidth, y2: 0,
        class: 'top'
      }, {
        x1: 0 + subMargin.left, y1: (subHeight / 2),
        x2: subWidth, y2: (subHeight / 2),
        class: 'middle'
      }].map(function(c) {
        currSelection
          .append('line')
          .attr('class', c.class)
          .attr('x1', c.x1).attr('y1', c.y1)
          .attr('x2', c.x2).attr('y2', c.y2);
      });

      // Axis labels
      currSelection = gEnter
        .append('g')
        .attr('class', 'axis-labels');
      [{
        name: 'y-label text-units',
        x: subMargin.left - 15, y: 15
      }, {
        name: 'y-label text-count',
        x: subMargin.left - 15, y: 5
      }, {
        name: 'x-label min',
        x: (0 + subMargin.left), y: (-subMargin.top - 5)
      }, {
        name: 'x-label max',
        x: subWidth, y: (-subMargin.top - 5)
      }, {
        name: 'y-label second-label',
        x: (subWidth + 5),  y: 5
      }].map(function(c) {
        currSelection
          .append('text')
          .attr('class', c.name)
          .attr('transform', 'translate(' + c.x + ',' + c.y + ')');
      });

      // Error message, if needed
      gEnter
        .append('text')
        .attr('class', 'error-message')
        .attr('x', subWidth / 2)
        .attr('y', (subHeight / 2) + 5)
        .text('\u26A0 data unavailable')
        .style('display', 'none');

      // Handle bad data
      if (!validate(data)) {
        // Draw error message
        container.selectAll('text.error-message').style('display', null);
        // Hide everything drawn already
        container.selectAll('.legend, .overlay, .axis-labels, .line-div')
          .style('display', 'none');
        return;
      }
      // Redraw anything hidden by errors
      container.selectAll('.legend, .overlay, .axis-labels, .line-div')
        .style('display', null);
      // Hide error message
      container.selectAll('text.error-message').style('display', 'none');

      // Setup range
      keys = data.dataSets.map(function(f) { return f.line; });
      var minTime = data.localTime[data.localTime.length - 1];
      minTime = new Date(minTime.getTime() - (data.xLength * 1000));
      var xDomain = d3.extent([minTime].concat(data.localTime));
      var legendWidth = (subWidth - subMargin.top) / data.keyLength;
      var scale2 = 'secondScale' in data;
      x
        .domain(xDomain)
        .range([0, subWidth]);
      y
        .domain(data.yDomain)
        .range([subHeight, 0]);
      var timeZero = x.invert(subMargin.left);

      // Update labels
      container.selectAll('text.text-count')
        .text(d3.format('s')(data.yDomain[1]));
      container.selectAll('text.text-units') // Repeat this in case error occurred
        .text(data.labels.yAxis);
      container.selectAll('text.max')
        .text(d3.time.format('%X')(xDomain[1]));
      container.selectAll('text.min')
        .text(d3.time.format('%X')(timeZero));

      // Chart Lines
      g.selectAll('.line-div').data(data.dataSets)
        .enter().append('g')
        .attr('class', 'line-div')
        .append('path')
        .attr('class', function(d, i) { return 'line chart-color-' + i; })
        .style('fill', 'none')
        .attr('id', function(d) { return 'tag' + d.line; } );
      var line = d3.svg.line()
        .interpolate('monotone')
        .x(function(d, i) { return x(data.localTime[i]); })
        .y(function(d) { return y(d); });
      container.selectAll('path.line')
        .attr('d', function(d) { return line(d.count); });

      // add data from line with separate axis
      if (scale2) {
        keys.push(data.secondScale.line);
        // update label
        container.selectAll('text.second-label')
          .text(d3.format('s')(data.secondScale.currentMax)); // in case its really large
        // update line
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
          .attr('id', function(d) { return 'tag' + d.line; });
        container.selectAll('.second-line')
          .attr('d', function(d) { return line2(d.count); });
      }

      // Legend
      var l = container.selectAll('g.legend').data([0]);
      var mLeft = margin.left + subMargin.left;
      var mRight = subHeight + margin.top + subMargin.top;
      l.enter()
        .append('g')
        .attr('class', 'legend')
        .attr('width', subWidth)
        .attr('height', margin.bottom)
        .attr('transform', 'translate(' + mLeft + ',' + mRight + ')');

      var legendDiv = l.selectAll('g.subLegend').data(keys).enter()
        .append('g')
        .attr('class', 'subLegend')
        .attr('transform', function(d, i) {
          if (scale2 && i === (keys.length - 1)) { // Set location if on separate axis.
            return 'translate(' + (subWidth - 120) + ',5)';
          }
          return 'translate(' + (i * legendWidth) + ',5)';
        });
      // Add boxes for legend
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
      // Add text for legend
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
      var focusP = container.selectAll('g.focus').data([0]);
      var focus = focusP.enter()
        .append('g')
        .attr('class', 'focus')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .style('display', 'none');
      focus.append('line')
        .attr('class', 'overlay-line')
        .attr('transform', 'translate(' + subWidth + ',0)')
        .attr('x1', 0).attr('y1', subHeight)
        .attr('x2', 0).attr('y2', 0);
      focus.append('path')
        .attr('class', 'overlay-triangle')
        .attr('transform', 'translate(' + subWidth + ',0)')
        .attr('d', d3.svg.symbol().type('triangle-down'));
      focus.append('text')
        .attr('class', 'overlay-date')
        .attr('transform', 'translate(' + subWidth + ',0)');
      focusP.selectAll('rect.overlay-bubbles').data(keys).enter()
        .append('rect')
        .attr('class', function(d, i) { return 'overlay-bubbles chart-color-' + i; })
        .attr('id', function(d) { return 'bubble' + d; })
        .attr('width', bubbleWidth)
        .attr('height', bubbleWidth)
        .attr('rx', bubbleWidth / 5)
        .attr('ry', bubbleWidth / 5);

      // Transform overlay elements to current selection
      function updateOverlay() {
        var bisectDate = d3.bisector(function(d) { return d; }).left;
        var index = bisectDate(data.localTime, x.invert(mouseLocation), 1);
        if (index >= data.localTime.length) {
          return;
        }
        var xOffset = x(data.localTime[index]);
        focus = container.selectAll('g.focus');
        focus.selectAll('line.overlay-line')
          .attr('transform', 'translate(' + xOffset + ',0)');
        focus.selectAll('path.overlay-triangle')
          .attr('transform', 'translate(' + xOffset + ',-5)');
        focus.selectAll('text.overlay-date')
          .attr('transform', 'translate(' + xOffset + ',-15)')
          .text(d3.time.format('%X')(data.localTime[index]));
        var key;
        var xM = xOffset - (bubbleWidth / 2);
        var yOffset;
        var yM;
        var currentText;
        for (var k = 0; k < data.dataSets.length; k++) {
          key = data.dataSets[k];
          yOffset = y(key.count[index]);
          yM = yOffset - (bubbleWidth / 2);
          focus.selectAll('rect.chart-color-' + k)
            .attr('transform', 'translate(' + xM + ',' + yM + ')');
          currentText = container.selectAll('text.legend-count.text-' + key.line);
          currentText.text(key.count[index]);
        }
        // Update overlay for line on separate scale
        if (scale2) {
          yOffset = y2(data.secondScale.count[index]);
          yM = yOffset - (bubbleWidth / 2);
          focus.selectAll('rect.chart-color-' + (keys.length - 1))
            .attr('transform', 'translate(' + xM + ',' + yM + ')');
          currentText = container.selectAll('text.legend-count.text-' + data.secondScale.line);
          currentText.text(data.secondScale.count[index]);
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
          .text(function(d, i) {
            if (scale2 && i == keys.length - 1) {
              return data.secondScale.count[data.secondScale.count.length - 1];
            }
            return data.dataSets[i].count[data.dataSets[i].count.length - 1];
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
