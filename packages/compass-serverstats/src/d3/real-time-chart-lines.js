const d3 = require('d3');

function realTimeChartLines() {
  let xScale = d3.time.scale();
  let yScale = d3.scale.linear();
  let xVal = (datum) => datum.x;
  let yVal = (datum) => datum.y;
  let yData = (yValue) => yValue.data;
  let color = d3.scale.category10();
  let strokeWidth = 1;
  let defined = () => true;
  let singlePointDistance;
  let expectedPointSpeed;
  const x = (datum, i) => xScale(xVal(datum, i));
  const y = (datum, i) => yScale(yVal(datum, i));

  function component(selection) {
    selection.each(function(data) {
      const lineGroup = d3.select(this);

      // establish the path-generating function for each line
      const line = d3.svg.line()
        .defined(defined)
        .interpolate('monotone')
        .x(x)
        .y(y);

      // establish a clip-path to prevent the lines being drawn out of bounds
      lineGroup.selectAll('defs').data([0]).enter()
        .append('defs')
          .append('clipPath')
            .attr('id', 'clip')
            .append('rect');

      lineGroup.selectAll('clipPath#clip rect')
        .attr('width', Math.abs(xScale.range()[0] - xScale.range()[1]))
        .attr('height', Math.abs(yScale.range()[0] - yScale.range()[1]) + strokeWidth);

      lineGroup
          .attr('clip-path', 'url(#clip)');

      // add the paths to the provided selection
      const dataLines = lineGroup.selectAll('path.line').data(data, (d, i) => i);
      dataLines.enter().append('path')
        .attr('class', 'line')
        .attr('stroke-width', strokeWidth)
        .attr('stroke', (d, i) => color(i))
        .style('fill', 'none');

      // draw the proper path
      dataLines
        .attr('d', (lineData, i) => line(yData(lineData, i)));

      // animate if animation parameters have been specified
      if (!isNaN(Number(singlePointDistance)) && expectedPointSpeed) {
        dataLines.interrupt('translate');
        dataLines
          .attr('transform', isNaN(singlePointDistance) ? null : `translate(${singlePointDistance})`)
          .transition('translate')
            .duration(expectedPointSpeed)
            .ease(d3.ease('linear'))
            .attr('transform', 'translate(0)');
      }
    });
  }

  component.xScale = function(value) {
    if (typeof value === 'undefined') return xScale;
    xScale = value;
    return component;
  };

  component.yScale = function(value) {
    if (typeof value === 'undefined') return yScale;
    yScale = value;
    return component;
  };

  component.xVal = function(value) {
    if (typeof value === 'undefined') return xVal;
    xVal = value;
    return component;
  };

  component.yVal = function(value) {
    if (typeof value === 'undefined') return yVal;
    yVal = value;
    return component;
  };

  component.yData = function(value) {
    if (typeof value === 'undefined') return yData;
    yData = value;
    return component;
  };

  component.color = function(value) {
    if (typeof value === 'undefined') return color;
    color = value;
    return component;
  };

  component.defined = function(value) {
    if (typeof value === 'undefined') return defined;
    defined = value;
    return component;
  };

  component.singlePointDistance = function(value) {
    if (typeof value === 'undefined') return singlePointDistance;
    singlePointDistance = value;
    return component;
  };

  component.expectedPointSpeed = function(value) {
    if (typeof value === 'undefined') return expectedPointSpeed;
    expectedPointSpeed = value;
    return component;
  };

  component.strokeWidth = function(value) {
    if (typeof value === 'undefined') return strokeWidth;
    strokeWidth = value;
    return component;
  };

  return component;
}

module.exports = realTimeChartLines;
