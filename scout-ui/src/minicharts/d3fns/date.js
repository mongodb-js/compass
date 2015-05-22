var d3 = require('d3');
var _ = require('lodash');
var moment = require('moment');
var shared = require('./shared');
var debug = require('debug')('scout-ui:minicharts:date');
var many = require('./many');

require('d3-tip')(d3);

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

  var margin = shared.margin;
  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  var barcodeTop = Math.floor(height / 2 + 10);
  var barcodeBottom = Math.floor(height - 10);

  var barcodeX = d3.time.scale()
    .domain(d3.extent(values))
    .range([0, width]);

  var upperBarBottom = height / 2 - 20;
  var upperRatio = 2.5;
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
        label: weekdayLabels[i],
        value: d.length,
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
    .defaults(generateDefaults(24))
    .map(function(d, i) {
      return {
        label: hourLabels[i] + ':00',
        value: d.length,
        tooltip: hourLabels[i] + ':00'
      };
    })
    .value();

  // clear element first
  d3.select(el).selectAll('*').remove();

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d, i) {
      return format(d);
    })
    .direction('n')
    .offset([-9, 0]);

  var svg = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .call(tip);

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
    .attr('y2', barcodeBottom)
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

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
    .text(function(d, i) {
      if (format(barcodeX.domain()[0]) === format(barcodeX.domain()[1])) {
        if (i === 0) {
          return 'inserted: ' + format(d);
        }
      } else {
        return (i ? 'last: ' : 'first: ') + format(d);
      }
    });

  var weekdayContainer = svg.append('g');

  many(weekdays, weekdayContainer, width / (upperRatio + 1) - upperMargin, upperBarBottom, {
    bgbars: true,
    labels: {
      'text-anchor': 'middle',
      'text': function(d) {
        return d.label[0];
      }
    }
  });

  // calendar icon
  weekdayContainer.append('text')
    .attr('class', 'date-icon fa-fw')
    .attr('x', 0)
    .attr('dx', '-0.6em')
    .attr('y', 0)
    .attr('dy', '1em')
    .attr('text-anchor', 'end')
    .attr('font-family', 'FontAwesome')
    .text('\uf133');

  var hourContainer = svg.append('g')
    .attr('transform', 'translate(' + (width / (upperRatio + 1) + upperMargin) + ', 0)');

  many(hours, hourContainer, width / (upperRatio + 1) * upperRatio - upperMargin, upperBarBottom, {
    bgbars: true,
    labels: {
      'text': function(d, i) {
        return (i % 6 === 0 || i === 23) ? d.label : '';
      }
    }
  });

  // clock icon
  hourContainer.append('text')
    .attr('class', 'date-icon fa-fw')
    .attr('x', 0)
    .attr('dx', '-0.6em')
    .attr('y', 0)
    .attr('dy', '1em')
    .attr('text-anchor', 'end')
    .attr('font-family', 'FontAwesome')
    .text('\uf017');

};

