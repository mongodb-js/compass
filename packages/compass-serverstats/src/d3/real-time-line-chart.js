/* eslint complexity:0 */
const d3 = require('d3');
const TopStore = require('../stores/top-store');
const CurrentOpStore = require('../stores/current-op-store');

/**
 * The data sets property.
 */
const DATA_SETS = 'dataSets';

/**
 * The local time property.
 */
const LOCAL_TIME = 'localTime';

/**
 * The y domain property.
 */
const Y_DOMAIN = 'yDomain';

/**
 * The x length property.
 */
const X_LENGTH = 'xLength';

/**
 * The labels property.
 */
const LABELS = 'labels';

/**
 * The key length property.
 */
const KEY_LENGTH = 'keyLength';

/**
 * The required properties for the data to have.
 */
const REQUIRED_PROPERTIES = [
  DATA_SETS,
  LOCAL_TIME,
  Y_DOMAIN,
  X_LENGTH,
  LABELS,
  KEY_LENGTH
];

/**
 * The second scale property.
 */
const SECOND_SCALE = 'secondScale';

/**
 * The line property.
 */
const LINE = 'line';

/**
 * The count property.
 */
const COUNT = 'count';

/**
 * The active property.
 */
const ACTIVE = 'active';

/**
 * The keys property.
 */
const KEYS = 'keys';

/**
 * Function to generate the real-time line chart.
 *
 * @returns {Function} The chart function.
 */
const realTimeLineChart = () => {
  const x = d3.time.scale();
  const y = d3.scale.linear();
  const y2 = d3.scale.linear();
  const bubbleWidth = 8;
  const margin = { top: 25, right: 40, bottom: 45, left: 55 };
  let width = 520;
  let height = 160;
  let keys = [];
  let onOverlay = false;
  let mouseLocation = null;
  let zeroState = true;
  let errorState = false;

  /**
   * Validate the provided data is in the correct format.
   *
   * @param {Object} data - The data.
   *
   * @returns {Boolean} If the data is valid.
   */
  const validate = (data) => {
    REQUIRED_PROPERTIES.forEach((property) => {
      if (!(property in data)) {
        return false;
      }
    });
    let len = data.dataSets.length;
    if (SECOND_SCALE in data) {
      if (!(LINE in data.secondScale && COUNT in data.secondScale && ACTIVE in data.secondScale) ||
          data.secondScale.count.length !== data.localTime.length) {
        return false;
      }
      len++;
    }
    if (data.localTime.length === 0 ||
        data.yDomain.length !== 2 || data.yDomain[0] >= data.yDomain[1] ||
        !(KEYS in data.labels) || data.labels.keys.length !== len) {
      return false;
    }
    data.dataSets.forEach((dataSet) => {
      if (!(LINE in dataSet && COUNT in dataSet && ACTIVE in dataSet) ||
          dataSet.count.length !== data.localTime.length) {
        return false;
      }
    });
    return true;
  };

  function chart(selection) {
    selection.each(function(data) {
      const subHeight = height - margin.top - margin.bottom;
      const subWidth = width - margin.left - margin.right;
      const xTick = subWidth / data.xLength;
      const subMargin = 10;

      // Create chart
      const container = d3.select(this);
      const g = container.selectAll('g.chart').data([0]);
      const gEnter = g.enter()
        .append('g')
        .attr('class', 'chart')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      gEnter
        .append('rect')
        .attr('class', 'chart-rect')
        .style('width', subWidth)
        .style('height', subHeight);

      // Title
      gEnter
        .append('text')
        .attr('class', 'chart-title')
        .attr('x', 0)
        .attr('y', -subMargin);
      if ('labels' in data && 'title' in data.labels) {
        g.selectAll('text.chart-title')
          .text(data.labels.title);
      }

      // Axis labels
      const currSelection = gEnter
        .append('g')
        .attr('class', 'chart-axis-labels');
      [{
        name: 'chart-y-label text-units',
        x: -5, y: subMargin * 2
      }, {
        name: 'chart-second-label second-units',
        x: (subWidth + 5), y: subMargin * 2
      }, {
        name: 'chart-y-label text-count',
        x: -5, y: subMargin
      }, {
        name: 'chart-second-label second-count',
        x: (subWidth + 5), y: subMargin
      }].map(function(c) {
        currSelection
          .append('text')
          .attr('class', c.name)
          .attr('transform', 'translate(' + c.x + ',' + c.y + ')');
      });

      // Handle 0-state
      if (zeroState) {
        zeroState = false;
        return;
      }
      // Handle bad data
      if (!validate(data)) {
        // Error message, if needed
        if (!errorState) {
          container.selectAll('g.chart')
            .append('rect')
            .attr('class', 'chart-error-overlay')
            .attr('transform', 'translate(' + ((subWidth - 300) / 2) + ',' + ((subHeight - 40) / 2) + ')')
            .attr('width', 300)
            .attr('height', 40)
            .style('opacity', 0.3);
          container.selectAll('g.chart')
            .append('text')
            .attr('class', 'chart-error-message')
            .attr('x', subWidth / 2)
            .attr('y', (subHeight / 2) + 5)
            .text('\u26A0 data unavailable')
            .style('opacity', 1);
        }
        errorState = true;
        return;
      }
      if (errorState) { // TODO: fix when layering elements is working properly
        errorState = false;
        container.selectAll('rect.chart-error-overlay').remove();
        container.selectAll('text.chart-error-message').remove();
      }
      // Redraw anything hidden by errors
      container.selectAll('.legend, .overlay, .chart-axis-labels, .chart-line-div')
        .style('display', null);
      // Hide error message
      container.selectAll('text.chart-error-message').style('display', 'none');

      // Line setup
      const maxTime = data.localTime[data.localTime.length - 1];
      const minTime = new Date(maxTime.getTime() - (data.xLength * 1000));
      const legendWidth = subWidth / data.keyLength;
      const scale2 = 'secondScale' in data;
      keys = data.dataSets.map(function(f) { return f.line; });
      if (scale2) {
        keys.push(data.secondScale.line);
      }
      // Update scales
      x
        .domain([minTime, maxTime])
        .range([0, subWidth]);
      y
        .domain(data.yDomain)
        .range([subHeight, 0]);
      // second line scale
      if (scale2) {
        y2
          .domain([0, data.secondScale.currentMax])
          .range([subHeight, 0]);
      }
      const timeZero = x.domain()[0];

      // Update labels
      container.selectAll('text.text-count')
        .text(d3.format('s')(data.yDomain[1]));
      container.selectAll('text.text-units') // Repeat this in case error occurred
        .text(data.labels.yAxis);
      container.selectAll('text.max')
        .text(d3.time.format('%X')(maxTime));
      container.selectAll('text.min')
        .text(d3.time.format('%X')(timeZero));
      // second line label
      if (scale2) {
        container.selectAll('text.second-count')
          .text(d3.format('s')(data.secondScale.currentMax)); // in case its really large
        container.selectAll('text.second-units')
          .text(data.secondScale.units);
      }

      // Add Chart Lines
      g.selectAll('.chart-line-div').data(data.dataSets)
        .enter().append('g')
        .attr('class', 'chart-line-div')
        .append('path')
        .attr('class', function(d, i) { return 'line chart-color-' + i; })
        .style('fill', 'none')
        .attr('id', function(d) { return 'tag' + d.line; } );
      // second line divs
      if (scale2) {
        g.selectAll('.chart-second-line-div').data([data.secondScale])
          .enter().append('g')
          .attr('class', 'chart-second-line-div')
          .append('path')
          .attr('class', 'second-line chart-color-' + (keys.length - 1))
          .style('fill', 'none')
          .attr('id', function(d) {
            return 'tag' + d.line;
          });
      }

      // Update lines + Animate smoothly
      const line = d3.svg.line()
        .defined(function(d, i) { // Don't draw if coming back from sleep, or off the chart.
          if (data.skip[i]) {
            return false;
          }
          return (x(data.localTime[i]) >= x.range()[0] && x(data.localTime[i]) <= x.range()[1]);
        })
        .interpolate('monotone')
        .x(function(d, i) { return x(data.localTime[i]); })
        .y(function(d) { return y(d); });
      const time = data.paused ? 0 : 983;
      const translate = 'translate(' + (data.paused ? 0 : -xTick) + ',0)';
      let ticked = false;
      function tick() {
        // Only tick once per call, TODO: fix, feels hacky
        if (!ticked) {
          ticked = true;
        } else {
          return;
        }
        container.selectAll('path.line')
          .attr('d', function(d) { return line(d.count); })
          .attr('transform', null)
          .transition()
          .duration(time)
          .ease('linear')
          .attr('transform', translate);
        if (scale2) {
          const line2 = d3.svg.line()
            .defined(function(d, i) { // Don't draw if coming back from sleep, or off the chart.
              if (data.skip[i]) {
                return false;
              }
              return (x(data.localTime[i]) >= x.range()[0] && x(data.localTime[i]) <= x.range()[1]);
            })
            .interpolate('monotone')
            .x(function(d, i) {
              return x(data.localTime[i]);
            })
            .y(function(d) {
              return y2(d);
            });
          container.selectAll('.second-line')
            .attr('d', function(d) { return line2(d.count); })
            .attr('transform', null)
            .transition()
            .duration(time)
            .ease('linear')
            .attr('transform', translate);
        }
        container.transition()
          .duration(time)
          .each('end', function() { tick(); });
      }

      tick();

      // Legend
      const l = container.selectAll('g.legend').data([0]);
      l.enter()
        .append('g')
        .attr('class', 'legend')
        .attr('width', subWidth)
        .attr('height', margin.bottom)
        .attr('transform', 'translate(' + margin.left + ',' + (subHeight + margin.top + subMargin) + ')');

      const legendDiv = l.selectAll('g.subLegend').data(keys).enter()
        .append('g')
        .attr('class', 'subLegend')
        .attr('transform', function(d, i) {
          let minus = i * 5;
          if (i === keys.length - 1) {
            if (scale2) { // Set location if on separate axis.
              return 'translate(' + (subWidth - 120) + ',0)';
            }
            minus = minus - 15;
          }
          return 'translate(' + ((i * legendWidth) - minus) + ',0)';
        });
      // Add boxes for legend
      legendDiv
        .append('rect')
        .attr('class', function(d, i) { return 'chart-legend-box chart-color-' + i; })
        .attr('id', function(d) { return 'box' + d; })
        .attr('width', bubbleWidth)
        .attr('height', bubbleWidth)
        .attr('rx', bubbleWidth / 5)
        .attr('ry', bubbleWidth / 5)

        .on('click', function(d, i) {
          let currLine;
          if (i >= data.dataSets.length && scale2) {
            currLine = data.secondScale;
          } else {
            currLine = data.dataSets[i];
          }
          const active = currLine.active ? false : true;
          const newOpacity = active ? 1 : 0;
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
        .attr('class', 'chart-legend-linename')
        .attr('transform', 'translate(' + 13 + ',' + 9 + ')')
        .text(function(d, i) {return data.labels.keys[i]; });
      legendDiv
        .append('text')
        .attr('class', function(d) { return 'chart-legend-count text-' + d;} )
        .attr('transform', 'translate(' + 15 + ',22)');

      // Create overlay line
      const focus = container.selectAll('g.chart-focus').data([0]).enter()
        .append('g')
        .attr('class', 'chart-focus')
        .attr('transform', 'translate(' + (margin.left - xTick) + ',' + margin.top + ')');
      focus.append('line')
        .attr('class', 'chart-overlay-line')
        .attr('transform', 'translate(' + subWidth + ',0)')
        .attr('x1', 0).attr('y1', subHeight)
        .attr('x2', 0).attr('y2', 0);
      focus.append('path')
        .attr('class', 'overlay-triangle')
        .attr('transform', 'translate(' + subWidth + ',0)')
        .attr('d', d3.svg.symbol().type('triangle-down').size(bubbleWidth * 3));

      // Transform overlay elements to current selection
      function updateOverlay() {
        const bisectDate = d3.bisector(function(d) { return d; }).left;
        let index = bisectDate(data.localTime, x.invert(mouseLocation), 1);
        if (index >= data.localTime.length) {
          index = data.localTime.length - 1;
        }
        while (data.skip[index]) {
          index++;
        }
        if ('trigger' in data) {
          TopStore.mouseOver(index);
          CurrentOpStore.mouseOver(index);
        }
        const xOffset = x(data.localTime[index]);
        const myfocus = container.selectAll('g.chart-focus');
        myfocus.selectAll('line.chart-overlay-line')
          .attr('transform', 'translate(' + xOffset + ',0)');
        myfocus.selectAll('path.overlay-triangle')
          .attr('transform', 'translate(' + xOffset + ',-3)');

        d3.select('text.currentTime').text(d3.time.format('%X')(data.localTime[index]));

        let key;
        let currentText;
        for (let k = 0; k < data.dataSets.length; k++) {
          key = data.dataSets[k];
          currentText = container.selectAll('text.chart-legend-count.text-' + key.line);
          currentText.text(key.count[index]);
        }
        // Update overlay for line on separate scale
        if (scale2) {
          currentText = container.selectAll('text.chart-legend-count.text-' + data.secondScale.line);
          currentText.text(data.secondScale.count[index]);
        }
      }

      // Transform overlay elements to current time
      function resetOverlay() {
        const xOffset = x.range()[1] + xTick;
        const myfocus = container.selectAll('g.chart-focus');
        myfocus.selectAll('line.chart-overlay-line')
          .attr('transform', 'translate(' + xOffset + ',0)');
        myfocus.selectAll('path.overlay-triangle')
          .attr('transform', 'translate(' + xOffset + ',-3)');
      }

      // Bind overlay updating function to mouse movements over the chart
      container.selectAll('rect.overlay').data([0]).enter()
        .append('rect')
        .attr('class', 'overlay')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', subWidth)
        .attr('height', subHeight)
        .style('opacity', 0);

      d3.selectAll('rect.overlay')
        .on('mouseover.' + data.labels.title[0], function() {
          onOverlay = true;
          container.selectAll('g.chart-focus').style('display', null);
        })
        .on('mouseout.' + data.labels.title[0], function() {
          onOverlay = false;
          if ('trigger' in data) {
            TopStore.mouseOut();
            CurrentOpStore.mouseOut();
          }
          resetOverlay();
        })
        .on('mousemove.' + data.labels.title[0], function() {
          // Set overlays to visible and update current selection
          mouseLocation = d3.mouse(this)[0];
          updateOverlay();
        });

      if (onOverlay) {
        updateOverlay();
      } else {
        d3.select('text.currentTime').text(d3.time.format('%X')(data.localTime[data.localTime.length - 1]));
        container.selectAll('text.chart-legend-count')
          .text(function(d, i) {
            if (scale2 && i === keys.length - 1) {
              return data.secondScale.count[data.secondScale.count.length - 1];
            }
            return data.dataSets[i].count[data.dataSets[i].count.length - 1];
          });
        resetOverlay();
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

module.exports = realTimeLineChart;
