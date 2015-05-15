var d3 = require('d3');
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('scout-ui:minichart-date');

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

  debug('values', values);

  // A formatter for dates
  var format = d3.time.format('%Y-%m-%d %H:%M:%S');

  var margin = {
    top: 10,
    right: 0,
    bottom: 10,
    left: 0
  };

  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  var barcodeTop = Math.floor(height / 2 + 10);
  var barcodeBottom = Math.floor(height - 10);

  var barcodeX = d3.time.scale()
    .domain(d3.extent(values))
    .range([0, width]);

  var upperBarBottom = height / 2 - 20;

  // group by weekdays
  var weekdayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  var weekdays = _.map(_.groupBy(values, function(d) {
    return moment(d).weekday();
  }), function(v) {
      return v.length;
    });

  // group by hours
  var hourLabels = d3.range(24);
  var hours = _.map(_.groupBy(values, function(d) {
    return d.getHours();
  }), function(v) {
      return v.length;
    });

  var weekdayX = d3.scale.ordinal()
    .domain(weekdayLabels)
    .rangeBands([0, width / 3 - 10], 0.3);

  var weekdayY = d3.scale.linear()
    .domain([0, d3.max(weekdays)])
    .range([upperBarBottom, 0]);


  var hourX = d3.scale.ordinal()
    .domain(hourLabels)
    .rangeBands([width / 3 + 10, width], 0.3);

  var hourY = d3.scale.linear()
    .domain([0, d3.max(hours)])
    .range([upperBarBottom, 0]);

  // clear element first
  d3.select(el).selectAll('*').remove();

  var svg = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var line = svg.selectAll('.line')
    .data(values)
    .enter().append('line')
    .attr('class', 'line')
    .attr('x1', function(d) {
      return barcodeX(d);
    })
    .attr('y1', barcodeTop)
    .attr('x2', function(d) {
      return barcodeX(d);
    })
    .attr('y2', barcodeBottom);

  var text = svg.selectAll('.text')
    .data(barcodeX.domain())
    .enter().append('text')
    .attr('class', 'text')
    .attr('dy', '0.75em')
    .attr('y', barcodeBottom + 5)
    .attr('x', function(d, i) {
      return i * width;
    })
    .attr('text-anchor', function(d, i) {
      return i ? 'end' : 'start';
    })
    .text(function(d) {
      return format(d);
    });


  var weekdayBar = svg.selectAll('.bar.weekday')
    .data(weekdays)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', function(d, i) {
      return 'translate(' + weekdayX(weekdayLabels[i]) + ', 0)';
    });

  weekdayBar.append('rect')
    .attr('class', 'bg')
    .attr('x', 0)
    .attr('width', weekdayX.rangeBand())
    .attr('height', upperBarBottom);

  weekdayBar.append('rect')
    .attr('class', 'fg')
    .attr('x', 0)
    .attr('y', function(d) {
      return weekdayY(d);
    })
    .attr('width', weekdayX.rangeBand())
    .attr('height', function(d) {
      return upperBarBottom - weekdayY(d);
    });

  weekdayBar.append('text')
    .attr('dy', '.75em')
    .attr('y', function(d) {
      return upperBarBottom + 5;
    })
    .attr('x', weekdayX.rangeBand() / 2)
    .attr('text-anchor', 'middle')
    .text(function(d, i) {
      return weekdayLabels[i][0];
    });


  var hourBar = svg.selectAll('.bar.hour')
    .data(hours)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', function(d, i) {
      return 'translate(' + hourX(hourLabels[i]) + ', 0)';
    });

  hourBar.append('rect')
    .attr('class', 'bg')
    .attr('x', 0)
    .attr('width', hourX.rangeBand())
    .attr('height', upperBarBottom);

  hourBar.append('rect')
    .attr('class', 'fg')
    .attr('x', 0)
    .attr('y', function(d) {
      return hourY(d);
    })
    .attr('width', hourX.rangeBand())
    .attr('height', function(d) {
      return upperBarBottom - hourY(d);
    });

  hourBar.append('text')
    .attr('dy', '.75em')
    .attr('y', function(d) {
      return upperBarBottom + 5;
    })
    .attr('x', hourX.rangeBand() / 2)
    .attr('text-anchor', 'middle')
    .text(function(d, i) {
      return (i % 6 === 0 || i === 23) ? hourLabels[i] : '';
    });


};

