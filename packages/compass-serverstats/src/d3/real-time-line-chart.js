/* eslint complexity:0 */
const d3 = require('d3');
const realTimeLegend = require('./real-time-legend');
const realTimeChartLines = require('./real-time-chart-lines');
const realTimeMouseOverlay = require('./real-time-mouse-overlay');

function realTimeLineChart() {
  const x = d3.time.scale();
  const y = d3.scale.linear();
  const y2 = d3.scale.linear();
  const bubbleWidth = 8;
  const margin = { top: 25, right: 40, bottom: 45, left: 55 };
  const dispatch = d3.dispatch('mouseover', 'mousemove', 'mouseout');

  let width = 520;
  let height = 160;

  let prefix = 'serverstats';
  let title = 'CHANGE ME';

  let xDomain = [0, 0];
  let xVal = (d) => d.x;
  let xValues = (/* data */) => [];

  let yDomain = [0, 0];
  let yVal = (d) => d.y;
  let yUnits = '';
  let yValues = (/* data */) => [];
  let yData = (yValue, /* i */) => yValue.data;
  let yLabel = (yValue, /* i */) => yValue.label;
  let yFormat = (d) => d;

  let y2Domain = null;
  let y2Val = (d) => d;
  let y2Units = '';
  let y2Values = (/* data */) => [];
  let y2Data = (y2Value, /* i */ ) => y2Value.data;
  let y2Label = (y2Value, /* i */) => y2Value.label;
  let y2Format = (d) => d;

  let defined = (d) => d.defined;
  let color = d3.scale.category10();
  let strokeWidth = 1;
  let animationDelay = 5000;
  let singlePointTime = 5000;
  let enableMouse = true;

  function chart(selection) {
    selection.each(function(data) {
      const subHeight = height - margin.top - margin.bottom;
      const subWidth = width - margin.left - margin.right;

      /*
       * Setup Components
       */

      // Scale configuration
      x
        .domain(xDomain)
        .range([0, subWidth]);
      y
        .domain(yDomain)
        .range([subHeight - strokeWidth, strokeWidth / 2]);
      y2
        .domain(y2Domain ? y2Domain : [0, 0])
        .range([subHeight - strokeWidth, strokeWidth / 2]);

      // Lines configuration
      let lineContainer = null;
      let line2Container = null;
      const lines = realTimeChartLines()
        .xScale(x)
        .yScale(y)
        .xVal(xVal)
        .yVal(yVal)
        .yData(yData)
        .color(color)
        .defined(defined)
        .strokeWidth(strokeWidth)
        .singlePointDistance(x(singlePointTime) - x(0))
        .expectedPointSpeed(animationDelay);

      const lines2 = realTimeChartLines()
        .xScale(x)
        .yScale(y2)
        .xVal(xVal)
        .yVal(yVal)
        .yData(y2Data)
        .color((i) => color(i + yValues(data).length))
        .defined(defined)
        .strokeWidth(strokeWidth)
        .singlePointDistance(x(singlePointTime) - x(0))
        .expectedPointSpeed(animationDelay);

      // Legend Configuration
      const legendClass = `${prefix}-legend`;
      const legend = realTimeLegend()
        .label(yLabel)
        .yData(yData)
        .color(color)
        .prefix(legendClass)
        .format(yFormat)
        .onToggle((d, i, active) => {
          const newOpacity = active ? 1 : 0;

          lineContainer.selectAll('path.line')
            .filter((pathD) => pathD === d)
            .transition('opacity')
              .duration(100)
              .style('opacity', newOpacity);
        });

      const legend2 = realTimeLegend()
        .label(y2Label)
        .yData(y2Data)
        .justifyContent('flex-end')
        .color((i) => color(i + yValues(data).length))
        .prefix(legendClass)
        .format(y2Format)
        .onToggle((d, i, active) => {
          const newOpacity = active ? 1 : 0;

          line2Container.selectAll('path.line')
            .filter((pathD) => d === pathD)
            .transition('opacity')
              .duration(100)
              .style('opacity', newOpacity);
        });

      // Overlay Configuration
      function getNearestXIndex(xPosition) {
        const xValue = x.invert(xPosition);
        const bisectPosition = d3.bisectLeft(xValues(data), xValue);
        let nearestDefinedPoint = Math.min(bisectPosition, xValues(data).length - 1);
        while (!defined(null, nearestDefinedPoint)) {
          nearestDefinedPoint++;
        }
        return nearestDefinedPoint;
      }
      const mouseOverlay = realTimeMouseOverlay()
        .bubbleWidth(8)
        .strokeWidth(2)
        .enableMouse(enableMouse)
        .on('reposition', (xPosition) => {
          const nearestXIndex = getNearestXIndex(xPosition);
          legend.showValues(nearestXIndex);
          legend2.showValues(nearestXIndex);
          dispatch.mousemove.call(null, nearestXIndex);
        })
        .on('mouseover', (xPosition) => {
          const nearestXIndex = getNearestXIndex(xPosition);
          dispatch.mouseover(nearestXIndex);
        })
        .on('mouseout', dispatch.mouseout);

      /*
       * Setup Elements
       */

      const container = d3.select(this);
      // Add Title
      const chartTitleClass = `${prefix}-chart-title`;
      container.selectAll(`p.${chartTitleClass}`).data([0]).enter()
        .append('p')
        .attr('class', chartTitleClass)
        .text(title);

      // Create row for drawn elements and labels
      const chartRowEnter = container.selectAll(`div.${prefix}-chart-row`).data([0]).enter()
        .append('div')
          .attr('class', `${prefix}-chart-row`)
          .style('display', 'flex')
          .style('justify-content', 'center')
          .style('align-items', 'flex-start');

      // Create first axis label
      const maxYValueClass = `${prefix}-max-y-value`;
      const maxYUnitsClass = `${prefix}-max-y-units`;
      const firstAxisLabel = chartRowEnter.append('p')
        .attr('class', `${prefix}-y-axis-label`)
        .style('text-align', 'right')
        .style('width', `${margin.left - (bubbleWidth / 2)}px`);
      firstAxisLabel.append('span')
        .attr('class', maxYValueClass);
      firstAxisLabel.append('span')
        .attr('class', maxYUnitsClass);

      // Create svg for drawn elements
      chartRowEnter
        .append('svg')
        .attr('class', `${prefix}-chart`)
        .attr('height', subHeight + (bubbleWidth / 2))
        .attr('width', subWidth + bubbleWidth)
      // chart group
        .append('g')
        .attr('class', `${prefix}-chart-group`)
        .attr('transform', `translate(${bubbleWidth / 2}, ${bubbleWidth / 2})`)
      // Chart background
        .append('rect')
        .attr('class', `${prefix}-chart-background`)
        .attr('width', subWidth)
        .attr('height', subHeight);

      const g = container.selectAll(`g.${prefix}-chart-group`);

      // Create second axis label
      const maxY2ValueClass = `${prefix}-max-y2-value`;
      const maxY2UnitsClass = `${prefix}-max-y2-units`;
      const secondAxisLabel = chartRowEnter.append('p')
        .attr('class', `${prefix}-y2-axis-label`)
        .style('width', `${margin.right - (bubbleWidth / 2)}px`);
      secondAxisLabel.append('span')
        .attr('class', maxY2ValueClass);
      secondAxisLabel.append('span')
        .attr('class', maxY2UnitsClass);

      lineContainer = g.selectAll('.chart-line-group-container').data([yValues(data)]);
      lineContainer.enter()
        .append('g')
        .attr('class', 'chart-line-group-container');

      lineContainer.call(lines);

      // Update labels
      container.selectAll(`span.${maxYValueClass}`)
        .text(yFormat(yDomain[1]));
      container.selectAll(`span.${maxYUnitsClass}`)
        .text(` ${yUnits}`);
      container.selectAll(`span.${maxY2ValueClass}`)
        .text(y2Domain ? y2Format(y2Domain[1]) : '');
      container.selectAll(`span.${maxY2UnitsClass}`)
        .text(` ${y2Units}`);

      const legendContainerClass = `${prefix}-legend-container`;
      const fullLegendContainer = container.selectAll(`div.${legendContainerClass}`).data([0]);
      fullLegendContainer.enter()
        .append('div')
        .attr('class', legendContainerClass)
        .style('margin-left', `${margin.left}px`)
        .style('margin-right', `${margin.right}px`)
        .style('display', 'flex')
        .style('justify-content', 'space-between');

      const l = fullLegendContainer.selectAll(`div.${legendClass}`).data([yValues(data)]);
      l.enter()
        .append('div')
        .style('display', 'flex')
        .style('flex-grow', '1')
        .attr('class', legendClass);
      l.call(legend);

      line2Container = g.selectAll('.chart-line-group-container-2').data([y2Values(data)]);
      line2Container.enter()
        .append('g')
        .attr('class', 'chart-line-group-container-2');
      line2Container.call(lines2);

      const l2 = fullLegendContainer.selectAll(`div.${legendClass}-2`).data([y2Values(data)]);
      l2.enter()
        .append('div')
        .style('display', 'flex')
        .style('flex-grow', '1')
        .attr('class', `${legendClass}-2`);
      l2.call(legend2);

      container
        .selectAll(`svg.${prefix}-chart`)
        .call(mouseOverlay);

      chart.setPosition = function(xPosition) {
        const nearestXIndex = getNearestXIndex(xPosition);
        realTimeMouseOverlay.setPosition(xPosition);
        legend.showValues(nearestXIndex);
        legend2.showValues(nearestXIndex);
      };
    });
  }

  /**
   * Control the overall width of the chart including titles margins, labels, and legend
   *
   * @param {Number} value - The new width of the chart
   *
   * @returns {Function|Number} The chart component, or the existing value if none supplied
   */
  chart.width = function(value) {
    if (typeof value === 'undefined') return width;
    width = value;
    return chart;
  };

  /**
   * Control the overall height of the chart including titles margins, labels, and legend
   *
   * @param {Number} value - The new height of the chart
   *
   * @returns {Function|Number} The chart component, or the existing value if none supplied
   */
  chart.height = function(value) {
    if (typeof value === 'undefined') return height;
    height = value;
    return chart;
  };

  /**
   * The title to be displayed at the top of the chart
   *
   * @param {String} value - The new title of the chart
   *
   * @returns {Function|String} The chart component, or the existing value if none supplied
   */
  chart.title = function(value) {
    if (typeof value === 'undefined') return title;
    title = value;
    return chart;
  };

  /**
   * Set the domain of possible values for the chart.
   *
   * @param {Array} value - The new domain. For a smooth chart, the difference between the upper and lower value should
   * always be the same timespan, i.e. the maximum timespan to show on the chart
   *
   * @returns {Function|Array} The chart component, or the existing value if none supplied
   */
  chart.xDomain = function(value) {
    if (typeof value === 'undefined') return xDomain;
    xDomain = value;
    return chart;
  };

  /**
   * The domain of y values on the left axis of the chart
   *
   * @param {Array} value - The new domain
   *
   * @returns {Function|Array} The chart component, or the existing value if none supplied
   */
  chart.yDomain = function(value) {
    if (typeof value === 'undefined') return yDomain;
    yDomain = value;
    return chart;
  };

  /**
   * The domain of y values on the right axis of the chart. If
   * only one axis is needed, this value can be ignored
   *
   * @param {Array} value - The new domain
   *
   * @returns {Function|Array} The chart component, or the existing value if none supplied
   */
  chart.y2Domain = function(value) {
    if (typeof value === 'undefined') return y2Domain;
    y2Domain = value;
    return chart;
  };

  /**
   * Set the xVal accessor.
   *
   * @param {Function} value - A function that, given a datum from yData or y2Data and that datum's index provides the value
   * of x for that datum
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.xVal = function(value) {
    if (typeof value === 'undefined') return xVal;
    xVal = value;
    return chart;
  };

  /**
   * Set the xValues accessor
   *
   * @param {Function} value - A function that, given the data bound to the selection returns an ordered array of all the
   * xValues represented in the data set in the same order as the data from yValues and y2Values
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.xValues = function(value) {
    if (typeof value === 'undefined') return xValues;
    xValues = value;
    return chart;
  };

  /**
   * Set the yVal accessor
   *
   * @param {Function} value - A function that, given a datum from yData and that datum's index, provides the y value for
   * that datum
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.yVal = function(value) {
    if (typeof value === 'undefined') return yVal;
    yVal = value;
    return chart;
  };

  /**
   * Set the units for the left axis of the chart
   *
   * @param {String} value - A string denoting the units for the left axis of the chart
   *
   * @returns {Function|String} The chart component, or the existing value if none supplied
   */
  chart.yUnits = function(value) {
    if (typeof value === 'undefined') return yUnits;
    yUnits = value;
    return chart;
  };

  /**
   * Set a formatter for data on the left axis
   *
   * @param {Function} value - A function that converts a data point to a string representation
   *
   * @returns {Function} The chart component, or the existing value if non supplied
   */
  chart.yFormat = function(value) {
    if (typeof value === 'undefined') return yFormat;
    yFormat = value;
    return chart;
  };

  /**
   *  Set the y2Val accessor
   *
   * @param {Function} value - A function that, given a datum from y2Data and that datum's index, provides the y value for
   * that datum
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.y2Val = function(value) {
    if (typeof value === 'undefined') return y2Val;
    y2Val = value;
    return chart;
  };

  /**
   * Set the units for the right axis of the chart
   *
   * @param {String} value - A string denoting the units for the right axis of the chart
   *
   * @returns {Function|String} The chart component, or the existing value if none supplied
   */
  chart.y2Units = function(value) {
    if (typeof value === 'undefined') return y2Units;
    y2Units = value;
    return chart;
  };

  /**
   * Set a formatter for data on the right axis
   *
   * @param {Function} value - A function that converts a data point to a string representation
   *
   * @returns {Function} The chart component, or the existing value if non supplied
   */
  chart.y2Format = function(value) {
    if (typeof value === 'undefined') return y2Format;
    y2Format = value;
    return chart;
  };

  /**
   * Set the yValues accessor
   *
   * @param {Function} value - A function that, given the data bound to the selection returns an array of items with each
   * item representing one line to be drawn for the left axis
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.yValues = function(value) {
    if (typeof value === 'undefined') return yValues;
    yValues = value;
    return chart;
  };

  /**
   * Set the yData accessor
   *
   * @param {Function} value - A function that, given one of the items returned by yValues, outputs and array of data points
   * for which to draw a line
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.yData = function(value) {
    if (typeof value === 'undefined') return yData;
    yData = value;
    return chart;
  };

  /**
   * Set the yLabel accessor
   *
   * @param {Function} value - A function that, given one of the items returned by yValues, outputs the label for that line
   * to be shown in the legend
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.yLabel = function(value) {
    if (typeof value === 'undefined') return yLabel;
    yLabel = value;
    return chart;
  };

  /**
   * Set the y2Values accessor
   *
   * @param {Function} value - A function that, given the data bound to the selection returns an array of items with each
   * item representing one line to be drawn for the right axis
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.y2Values = function(value) {
    if (typeof value === 'undefined') return y2Values;
    y2Values = value;
    return chart;
  };

  /**
   * Set the y2Data accessor
   *
   * @param {Function} value - A function that, given one of the items returned by y2Values, outputs and array of data points
   * for which to draw a line
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.y2Data = function(value) {
    if (typeof value === 'undefined') return y2Data;
    y2Data = value;
    return chart;
  };

  /**
   * Set the y2Label accessor
   *
   * @param {Function} value - A function that, given one of the items returned by y2Values, outputs the label for that line
   * to be shown in the legend
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.y2Label = function(value) {
    if (typeof value === 'undefined') return y2Label;
    y2Label = value;
    return chart;
  };

  /**
   * Set the defined accessor
   *
   * @Param {Function} value - A function that, given an item from yData or y2Data, and the index of that value, returns true
   * if a line should be drawn through that point, or if it should be skipped. Can also be given `null` and an index if only
   * an xValue is known.
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.defined = function(value) {
    if (typeof value === 'undefined') return defined;
    defined = value;
    return chart;
  };

  /**
   * Set the color accessor
   *
   * @param {Function} value - A function that, given the index of a line in the data
   * set, returns a color to draw the line as
   *
   * @returns {Function} The chart component, or the existing value if none supplied
   */
  chart.color = function(value) {
    if (typeof value === 'undefined') return color;
    color = value;
    return chart;
  };

  /**
   * Allows binding to 'mouseover', 'mousemove', and 'mouseout'
   * events on the chart. 'mouseover', and 'mousemove' events
   * are triggered with the index of the nearest xValue to the
   * event
   *
   * @param {String} event - The event to listen for
   * @param {Function} listener - The callback to be called when the event occurs
   *
   * @returns {Function} The chart component
   */
  chart.on = function(event, listener) {
    dispatch.on(event, listener);
    return chart;
  };

  /**
   * Set the CSS prefix for all the elements in the chart
   *
   * @param {String} value - The prefix to be preprended to every class in the component
   *
   * @returns {Function|String} The chart component, or the existing value if none supplied
   */
  chart.prefix = function(value) {
    if (typeof value === 'undefined') return prefix;
    prefix = value;
    return chart;
  };

  /**
   * Set the animation delay for the chart
   *
   * @param {Number} value - The rate at which points are expected to be added to the data in milliseconds, and by which each
   * point's xVal is expected to differe from the last one's.
   *
   * @returns {Function|Number} The chart component, or the existing value if none supplied
   */
  chart.animationDelay = function(value) {
    if (typeof value === 'undefined') return animationDelay;
    animationDelay = value;
    return chart;
  };

  /**
   * Set the amount of time between each x value on the chart for animation
   *
   * @param {Number} value - The expected difference from one x value to the next
   *
   * @returns {Function|Number} The chart component, or the existing value if none supplied
   */
  chart.singlePointTime = function(value) {
    if (typeof value === 'undefined') return singlePointTime;
    singlePointTime = value;
    return chart;
  };

  /**
   * Set the stroke width for the lines on the chart
   *
   * @param {Number} value - The new strokeWidth for the chart lines
   *
   * @returns {Function|Number} The chart component, or the existing value if none supplied
   */
  chart.strokeWidth = function(value) {
    if (typeof value === 'undefined') return strokeWidth;
    strokeWidth = value;
    return chart;
  };

  /**
   * Set whether or not to allow mouse interactions with the cart
   *
   * @param {Boolean} value - true if mouse interactions are allowed, false otherwise
   *
   * @returns {Function|Boolean} The chart component, or the existing value if none supplied
   */
  chart.enableMouse = function(value) {
    if (typeof value === 'undefined') return enableMouse;
    enableMouse = value;
    return chart;
  };

  return chart;
}

module.exports = realTimeLineChart;
