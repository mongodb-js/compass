const d3 = require('d3');
const debug = require('debug')('mongodb-compass:metrics:d3:rectangle');

function chart() {
  const width = 400;
  const height = 300;

  function inner(selection) {
    selection.each(function(data) {
      debug('hehe', data);
      // data is array of numbers, draw rectangle for each number
      const el = d3.select(this);
      const margin = {top: 20, right: 20, bottom: 30, left: 40};
      const paddedWidth = +width - margin.left - margin.right;
      const paddedHeight = +height - margin.top - margin.bottom;
      const g = el.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // scales for bar chart scaling
      const x = d3.scale.ordinal()
        .rangeRoundBands([0, paddedWidth], 0.1);

      const y = d3.scale.linear()
        .rangeRound([paddedHeight, 0]);

      const dates = data.map(function(d) { return d.date; });

      x.domain(dates);
      y.domain([0, d3.max(data, function(d) {
        let sum = 0;
        for (const vers in d.metrics) {
          if (d.metrics.hasOwnProperty(vers)) {
            sum += d.metrics[vers];
          }
        }
        return sum;
      })]).nice();

      const rects = g.selectAll('.rectangle').data(data);

      const barPadding = 4;
      // enter selection
      rects.enter().append('rect')
        .attr('class', 'rectangle')
        .attr('width', function() {
          return paddedWidth / data.length - barPadding;
        })
        .attr('y', function(d) {
          let sum = 0;
          for (const vers in d.metrics) {
            if (d.metrics.hasOwnProperty(vers)) {
              sum += d.metrics[vers];
            }
          }
          return y(sum);
        })
        .attr('x', function(d) {
          return x(d.date);
        });

      // update selection
      rects
        .transition()
        .attr('height', function(d) {
          let sum = 0;
          for (const vers in d.metrics) {
            if (d.metrics.hasOwnProperty(vers)) {
              sum += d.metrics[vers];
            }
          }
          return height - y(sum);
        })
        .attr('transform', 'scale(1, -1)');

      // axes to append
      const xAxis = d3.svg.axis()
        .scale(x)
        .orient('bottom');

      const yAxis = d3.svg.axis()
        .scale(y)
        .orient('left');

      g.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);

      g.append('g')
        .attr('class', 'axis axis--y')
        .call(yAxis);

      // exit selection
      rects.exit().remove();
    });
  }

  inner.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return inner;
  };

  inner.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return inner;
  };

  return inner;
}

module.exports = chart;
