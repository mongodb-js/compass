const d3 = require('d3');

function realTimeLegend() {
  let label = (d) => d.label;
  let prefix = 'legend';
  let color = d3.scale.category10();
  let bubbleWidth = 8;
  let onToggle = function(/* d, i, active */) { /* no-op */ };
  let justifyContent = 'flex-start';
  let format = (d) => d;
  let yData = (yValues) => yValues.data;

  function component(selection) {
    selection.each(function(data) {
      // Legend
      const legendGroup = d3.select(this);
      const legendDiv = legendGroup.selectAll(`div.${prefix}-item`).data(data).enter()
        .append('div')
        .attr('class', `${prefix}-item`);


      // Add boxes for legend
      legendDiv.append('svg')
        .attr('height', bubbleWidth + 2)
        .attr('width', bubbleWidth + 2)
        .append('rect')
          .attr('fill', (d, i) => color(i))
          .attr('stroke', (d, i) => color(i))
          .attr('class', `${prefix}-box`)
          .attr('width', bubbleWidth)
          .attr('height', bubbleWidth)
          .attr('x', 1)
          .attr('y', 1)
          .attr('rx', bubbleWidth / 5)
          .attr('ry', bubbleWidth / 5)
          .on('click', function(d, i) {
            const rect = d3.select(this);
            const active = rect.style('fill-opacity') !== '1';
            const newOpacity = active ? 1 : 0;
            rect.transition().duration(100)
              .style('fill-opacity', newOpacity);
            onToggle(d, i, active);
          });

      // Add text for legend
      const textSection = legendDiv.append('div')
        .attr('class', `${prefix}-text`);
      textSection
        .append('p')
        .attr('class', `${prefix}-linename`)
        .text(label);

      textSection
        .append('p')
        .attr('data-test-id', function(d) { return `performance-${label(d)}`; })
        .attr('class', `${prefix}-count`);

      const valueText = legendGroup.selectAll(`p.${prefix}-count`);

      component.showValues = function(nearestXIndex) {
        valueText.text((d, i) => format(yData(d, i)[nearestXIndex]));
      };
    });
  }

  component.label = function(value) {
    if (typeof value === 'undefined') return label;
    label = value;
    return component;
  };

  component.color = function(value) {
    if (typeof value === 'undefined') return color;
    color = value;
    return component;
  };

  component.bubbleWidth = function(value) {
    if (typeof value === 'undefined') return bubbleWidth;
    bubbleWidth = value;
    return component;
  };

  component.onToggle = function(value) {
    if (typeof value === 'undefined') return onToggle;
    onToggle = value;
    return component;
  };

  component.justifyContent = function(value) {
    if (typeof value === 'undefined') return justifyContent;
    justifyContent = value;
    return component;
  };

  component.yData = function(value) {
    if (typeof value === 'undefined') return yData;
    yData = value;
    return component;
  };

  component.prefix = function(value) {
    if (typeof value === 'undefined') return prefix;
    prefix = value;
    return component;
  };

  component.format = function(value) {
    if (typeof value === 'undefined') return format;
    format = value;
    return component;
  };

  return component;
}

module.exports = realTimeLegend;
