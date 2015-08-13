var d3 = require('d3');
var _ = require('lodash');
var moment = require('moment');
var shared = require('./shared');
var many = require('./many');
var raf = require('raf');
var debug = require('debug')('scout:minicharts:date');

require('../d3-tip')(d3);

function generateDefaults(n) {
  var doc = {};
  _.each(_.range(n), function(d) {
    doc[d] = [];
  });
  return doc;
}

function extractTimestamp(d) {
  return d._bsontype === 'ObjectID' ? d.getTimestamp() : d;
}

var minicharts_d3fns_date = function() {
  // --- beginning chart setup ---
  var width = 400;
  var height = 100;
  var upperRatio = 2.5;
  var upperMargin = 20;

  var options = {
    view: null
  };
  var weekdayLabels = moment.weekdays();

  // A formatter for dates
  var format = d3.time.format('%Y-%m-%d %H:%M:%S');

  var margin = shared.margin;
  var barcodeX = d3.time.scale();

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
      return d.label;
    })
    .direction('n')
    .offset([-9, 0]);

  var brush = d3.svg.brush()
    .x(barcodeX)
    .on('brush', brushed)
    .on('brushend', brushend);

  function brushed() {
    var lines = d3.selectAll(options.view.queryAll('.line'));
    var s = d3.event.target.extent();

    lines.classed('selected', function(d) {
      return s[0] <= d.ts && d.ts <= s[1];
    });
    lines.classed('unselected', function(d) {
      var pos = barcodeX(d.dt);
      return s[0] > pos || pos > s[1];
    });
  }

  function brushend() {
    var lines = d3.selectAll(options.view.queryAll('.line'));
    if (brush.empty()) {
      lines.classed('selected', false);
      lines.classed('unselected', false);
    }
    d3.select(this).call(brush.clear());

    if (!options.view) return;
    var evt = {
      selected: options.view.queryAll('line.line.selected'),
      type: 'drag',
      source: 'many'
    };
    options.view.trigger('querybuilder', evt);
  }
  // --- end chart setup ---

  var handleClick = function(d) {
    var evt = {
      d: d,
      self: this,
      all: options.view.queryAll('line.line'),
      evt: d3.event,
      type: 'click',
      source: 'date'
    };
    options.view.trigger('querybuilder', evt);
  };

  function chart(selection) {
    selection.each(function(data) {
      var values = data.map(function(d) {
        var ts = extractTimestamp(d);
        return {
          label: format(ts),
          ts: ts,
          value: d,
          count: 1,
          dx: 0 // this will trigger `$lte` instead of `$lt` for ranges in the query builder
        };
      });

      var innerWidth = width - margin.left - margin.right;
      var innerHeight = height - margin.top - margin.bottom;
      var el = d3.select(this);

      var barcodeTop = Math.floor(innerHeight / 2 + 15);
      var barcodeBottom = Math.floor(innerHeight - 10);

      var upperBarBottom = innerHeight / 2 - 20;

      barcodeX
        .domain(d3.extent(values, function(d) {
          return d.ts;
        }))
        .range([0, innerWidth]);

      // group by weekdays
      var weekdays = _(values)
        .groupBy(function(d) {
          return moment(d.ts).weekday();
        })
        .defaults(generateDefaults(7))
        .map(function(d, i) {
          return {
            label: weekdayLabels[i],
            count: d.length
          };
        })
        .value();

      // group by hours
      var hourLabels = d3.range(24);
      var hours = _(values)
        .groupBy(function(d) {
          return d.ts.getHours();
        })
        .defaults(generateDefaults(24))
        .map(function(d, i) {
          return {
            label: hourLabels[i] + ':00',
            count: d.length
          };
        })
        .value();
      el.call(tip);

      var g = el.selectAll('g').data([data]);

      // append g element if it doesn't exist yet
      var gEnter = g.enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      gEnter.append('g')
        .attr('class', 'weekday')
        .append('text')
        .attr('class', 'date-icon fa-fw')
        .attr('x', 0)
        .attr('dx', '-0.6em')
        .attr('y', 0)
        .attr('dy', '1em')
        .attr('text-anchor', 'end')
        .attr('font-family', 'FontAwesome')
        .text('\uf133');

      gEnter.append('g')
        .attr('class', 'hour')
        .attr('transform', 'translate(' + (width / (upperRatio + 1) + upperMargin) + ', 0)')
        .append('text')
        .attr('class', 'date-icon fa-fw')
        .attr('x', 0)
        .attr('dx', '-0.6em')
        .attr('y', 0)
        .attr('dy', '1em')
        .attr('text-anchor', 'end')
        .attr('font-family', 'FontAwesome')
        .text('\uf017');

      var lines = g.selectAll('.line')
        .data(values, function(d) {
          return d.ts;
        });

      lines.enter().append('line')
        .attr('class', 'line')
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

        // disabling direct onClick handler in favor of click-drag
        // .on('click', handleClick);

      lines
        .attr('y1', barcodeTop)
        .attr('y2', barcodeBottom)
        .attr('x2', function(d) {
          return barcodeX(d.ts);
        })
        .attr('x1', function(d) {
          return barcodeX(d.ts);
        });

      lines.exit().remove();

      var gBrush = g.selectAll('.brush').data([0]);
      gBrush.enter().append('g')
        .attr('class', 'brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', barcodeTop)
        .attr('height', barcodeBottom - barcodeTop);

      var text = g.selectAll('.text')
        .data(barcodeX.domain());

      text.enter().append('text')
        .attr('class', 'text')
        .attr('dy', '0.75em')
        .attr('y', barcodeBottom + 5);

      text
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

      text.exit().remove();

      var weekdayContainer = g.select('g.weekday').data([weekdays]);

      raf(function() {
        var chart = many()
          .width(width / (upperRatio + 1) - upperMargin)
          .height(upperBarBottom)
          .options({
            bgbars: true,
            labels: {
              'text-anchor': 'middle',
              text: function(d) {
                return d.label[0];
              }
            },
            view: options.view
          });
        weekdayContainer.call(chart);
      });

      var hourContainer = g.select('g.hour').data([hours]);
      raf(function() {
        var chartWidth = width / (upperRatio + 1) * upperRatio - upperMargin;
        var chart = many()
          .width(chartWidth)
          .height(upperBarBottom)
          .options({
            bgbars: true,
            labels: {
              text: function(d, i) {
                return i % 6 === 0 || i === 23 ? d.label : '';
              }
            },
            view: options.view
          });
        hourContainer.call(chart);
      });
    });
  }

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };

  chart.options = function(value) {
    if (!arguments.length) return options;
    options = value;
    return chart;
  };

  return chart;
};


// var minicharts_d3fns_date = function(opts) {
//   // A formatter for dates
//   var format = d3.time.format('%Y-%m-%d %H:%M:%S');
//
//   var handleClick = function(d, i) {
//     var evt = {
//       d: d,
//       i: i,
//       self: this,
//       all: opts.view.queryAll('line.line'),
//       evt: d3.event,
//       type: 'click',
//       source: 'date'
//     };
//     opts.view.trigger('querybuilder', evt);
//   };
//
//   var values = opts.model.values.toJSON().map(function(d) {
//     var ts = extractTimestamp(d);
//     return {
//       label: format(ts),
//       ts: ts,
//       value: d,
//       count: 1,
//       dx: 0 // this will trigger `$lte` instead of `$lt` for ranges in the query builder
//     };
//   });
//
//   var margin = shared.margin;
//   var width = opts.width - margin.left - margin.right;
//   var height = opts.height - margin.top - margin.bottom;
//   var el = opts.el;
//
//   var barcodeTop = Math.floor(height / 2 + 15);
//   var barcodeBottom = Math.floor(height - 10);
//
//   var barcodeX = d3.time.scale()
//     .domain(d3.extent(values, function(d) { return d.ts; }))
//     .range([0, width]);
//
//   var upperBarBottom = height / 2 - 20;
//   var upperRatio = 2.5;
//   var upperMargin = 20;
//
//   // group by weekdays
//   var weekdays = _(values)
//     .groupBy(function(d) {
//       return moment(d.ts).weekday();
//     })
//     .defaults(generateDefaults(7))
//     .map(function(d, i) {
//       return {
//         label: weekdayLabels[i],
//         count: d.length
//       };
//     })
//     .value();
//
//   // group by hours
//   var hourLabels = d3.range(24);
//   var hours = _(values)
//     .groupBy(function(d) {
//       return d.ts.getHours();
//     })
//     .defaults(generateDefaults(24))
//     .map(function(d, i) {
//       return {
//         label: hourLabels[i] + ':00',
//         count: d.length
//       };
//     })
//     .value();
//
//   // clear element first
//   d3.select(el).selectAll('*').remove();
//
//   // set up tooltips
//   var tip = d3.tip()
//     .attr('class', 'd3-tip')
//     .html(function(d) {
//       return d.label;
//     })
//     .direction('n')
//     .offset([-9, 0]);
//
//   var svg = d3.select(el)
//     .append('g')
//     .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
//     .call(tip);
//
//   svg.selectAll('.line')
//     .data(values)
//     .enter().append('line')
//     .attr('class', 'line')
//     .attr('x1', function(d) {
//       return barcodeX(d.ts);
//     })
//     .attr('y1', barcodeTop)
//     .attr('x2', function(d) {
//       return barcodeX(d.ts);
//     })
//     .attr('y2', barcodeBottom)
//     .on('mouseover', tip.show)
//     .on('mouseout', tip.hide)
//     .on('click', handleClick);
//
//   svg.selectAll('.text')
//     .data(barcodeX.domain())
//     .enter().append('text')
//     .attr('class', 'text')
//     .attr('dy', '0.75em')
//     .attr('y', barcodeBottom + 5)
//     .attr('x', function(d, i) {
//       return i * width;
//     })
//     .attr('text-anchor', function(d, i) {
//       return i ? 'end' : 'start';
//     })
//     .text(function(d, i) {
//       if (format(barcodeX.domain()[0]) === format(barcodeX.domain()[1])) {
//         if (i === 0) {
//           return 'inserted: ' + format(d);
//         }
//       } else {
//         return (i ? 'last: ' : 'first: ') + format(d);
//       }
//     });
//
//   var weekdayContainer = svg.append('g');
//
//   raf(function() {
//     var chart = many()
//       .width(width / (upperRatio + 1) - upperMargin)
//       .height(upperBarBottom)
//       .options({
//         bgbars: true,
//         labels: {
//           'text-anchor': 'middle',
//           text: function(d) {
//             return d.label[0];
//           }
//         },
//         view: opts.view
//       });
//
//     d3.select(weekdayContainer)
//       .datum(weekdays)
//       .call(chart);
//   });
//
//   // calendar icon
//   weekdayContainer.append('text')
//     .attr('class', 'date-icon fa-fw')
//     .attr('x', 0)
//     .attr('dx', '-0.6em')
//     .attr('y', 0)
//     .attr('dy', '1em')
//     .attr('text-anchor', 'end')
//     .attr('font-family', 'FontAwesome')
//     .text('\uf133');
//
//   var hourContainer = svg.append('g')
//     .attr('transform', 'translate(' + (width / (upperRatio + 1) + upperMargin) + ', 0)');
//
//   raf(function() {
//     var chartWidth = width / (upperRatio + 1) * upperRatio - upperMargin;
//     var chart = many()
//       .width(chartWidth)
//       .height(upperBarBottom)
//       .options({
//         bgbars: true,
//         labels: {
//           text: function(d, i) {
//             return i % 6 === 0 || i === 23 ? d.label : '';
//           }
//         },
//         view: opts.view
//       });
//
//     d3.select(hourContainer)
//       .datum(hours)
//       .call(chart);
//   });
//
//   // clock icon
//   hourContainer.append('text')
//     .attr('class', 'date-icon fa-fw')
//     .attr('x', 0)
//     .attr('dx', '-0.6em')
//     .attr('y', 0)
//     .attr('dy', '1em')
//     .attr('text-anchor', 'end')
//     .attr('font-family', 'FontAwesome')
//     .text('\uf017');
// };

module.exports = minicharts_d3fns_date;
