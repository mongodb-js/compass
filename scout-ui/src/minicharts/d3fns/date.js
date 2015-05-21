var d3 = require('d3');
var _ = require('lodash');
var moment = require('moment');
var debug = require('debug')('scout-ui:minicharts:date');
var many = require('./many');

function generateDefaults(n) {
  var doc = {};
  _.each(_.range(n), function(d) {
    doc[d] = 0;
  });
  return doc;
}

module.exports = function(opts) {

  var values = opts.data.values.toJSON();

  // distinguish ObjectIDs from real dates
  if (values.length && values[0]._bsontype !== undefined) {
    if (values[0]._bsontype === 'ObjectID') {
      values = _.map(values, function(v) {
        return v.getTimestamp();
      });
    }
  }

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
  var upperRatio = 2;
  var upperMargin = 15;

  // group by weekdays
  var weekdayLabels = moment.weekdays();
  var weekdays = _(values)
    .groupBy(function(d) {
      return moment(d).weekday();
    })
    .defaults(generateDefaults(7))
    .map(function(d, i) {
      return {
        x: weekdayLabels[i],
        y: d.length,
        tooltip: weekdayLabels[i]
      };
    })
    .value();

  // group by hours
  var hourLabels = d3.range(24);
  var hours = _(values)
    .groupBy(function(d) {
      return d.getHours();
    })
    .defaults(generateDefaults(23))
    .map(function(d, i) {
      return {
        x: hourLabels[i],
        y: d.length,
        tooltip: hourLabels[i] + 'h'
      };
    })
    .value();

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

  var weekdayContainer = svg.append('g');
  many(weekdays, weekdayContainer, width / (upperRatio + 1) - upperMargin, upperBarBottom, {
    bgbars: true,
    labels: {
      'text-anchor': 'middle',
      'text': function(d) {
        return d.x[0];
      }
    }
  });

  var hourContainer = svg.append('g')
    .attr('transform', 'translate(' + (width / (upperRatio + 1) + upperMargin) + ', 0)');

  many(hours, hourContainer, width / (upperRatio + 1) * upperRatio - upperMargin, upperBarBottom, {
    bgbars: true,
    labels: {
      'text': function(d, i) {
        return (i % 6 === 0 || i === 23) ? d.x : '';
      }
    }
  });

};

