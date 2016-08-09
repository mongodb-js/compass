const d3 = require('d3');
const debug = require('debug')('mongodb-compass:metrics:d3:rectangle');

function chart() {
  var width = 400,  // default width
      height = 300; // default height

  function inner(selection) {
    selection.each(function(data) {
      // data is array of numbers, draw rectangle for each number
      debug('data', data);
      const el = d3.select(this);

      const rects = el.selectAll('.rectangle').data(data);

      // enter selection
      rects.enter().append('rect')
        .attr('class', 'rectangle')
        .attr('width', 30)
        .attr('y', 100)
        .attr('x', function(d, i) {
          return i*(30+10);
        });

      // update selection
      rects
        .transition()
        .attr('height', (d) => { return d; })

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
