var d3 = require('d3');
var _ = require('lodash');
var many = require('./many');
var shared = require('./shared');
var debug = require('debug')('scout:minicharts:number');

var minicharts_d3fns_number = function(opts) {
  var width = 400;
  var height = 100;
  var options = {
    view: null
  };
  var margin = shared.margin;
  var xBinning = d3.scale.linear();
  var manyChart = many();

  function chart(selection) {
    selection.each(function(data) {
      var el = d3.select(this);
      var innerWidth = width - margin.left - margin.right;
      var innerHeight = height - margin.top - margin.bottom;

      // transform data
      if (options.model.unique < 20) {
        var grouped = _(data)
          .groupBy(function(d) {
            return d;
          })
          .map(function(v, k) {
            v.label = k;
            v.x = parseFloat(k, 10);
            v.value = v.x;
            v.dx = 0;
            v.count = v.length;
            return v;
          })
          .value();
      } else {
        // use the linear scale just to get nice binning values
        xBinning
          .domain(d3.extent(data))
          .range([0, innerWidth]);

        // Generate a histogram using approx. twenty uniformly-spaced bins
        var ticks = xBinning.ticks(20);
        var hist = d3.layout.histogram()
          .bins(ticks);

        grouped = hist(data);

        _.each(grouped, function(d, i) {
          var label;
          if (i === 0) {
            label = '< ' + (d.x + d.dx);
          } else if (i === data.length - 1) {
            label = '&ge; ' + d.x;
          } else {
            label = d.x + '-' + (d.x + d.dx);
          }
          // remapping keys to conform with all other types
          d.count = d.y;
          d.value = d.x;
          d.label = label;
        });
      }

      var g = el.selectAll('g').data([grouped]);

      // append g element if it doesn't exist yet
      g.enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      var labels;
      if (options.model.unique < 20) {
        labels = true;
      } else {
        labels = {
          text: function(d, i) {
            if (i === 0) return 'min: ' + d3.min(data);
            if (i === grouped.length - 1) return 'max: ' + d3.max(data);
            return '';
          }
        };
      }

      options.labels = labels;
      options.scale = true;

      manyChart
        .width(innerWidth)
        .height(innerHeight - 10)
        .options(options);

      g.call(manyChart);
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


//
// var minicharts_d3fns_number = function(opts) {
//   var values = opts.model.values.toJSON();
//
//   var margin = shared.margin;
//   var width = opts.width - margin.left - margin.right;
//   var height = opts.height - margin.top - margin.bottom;
//   var el = opts.el;
//
//   if (opts.model.unique < 20) {
//     var data = _(values)
//       .groupBy(function(d) {
//         return d;
//       })
//       .map(function(v, k) {
//         v.label = k;
//         v.x = parseFloat(k, 10);
//         v.value = v.x;
//         v.dx = 0;
//         v.count = v.length;
//         return v;
//       })
//       .value();
//   } else {
//     // use the linear scale just to get nice binning values
//     var x = d3.scale.linear()
//       .domain(d3.extent(values))
//       .range([0, width]);
//
//     // Generate a histogram using approx. twenty uniformly-spaced bins
//     var ticks = x.ticks(20);
//     var hist = d3.layout.histogram()
//       .bins(ticks);
//
//     data = hist(values);
//
//     _.each(data, function(d, i) {
//       var label;
//       if (i === 0) {
//         label = '< ' + (d.x + d.dx);
//       } else if (i === data.length - 1) {
//         label = '&ge; ' + d.x;
//       } else {
//         label = d.x + '-' + (d.x + d.dx);
//       }
//       // remapping keys to conform with all other types
//       d.count = d.y;
//       d.value = d.x;
//       d.label = label;
//     });
//   }
//
//   // clear element first
//   d3.select(el).selectAll('*').remove();
//
//   var g = d3.select(el)
//     .append('g')
//     .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
//
//   var labels;
//   if (opts.model.unique < 20) {
//     labels = true;
//   } else {
//     labels = {
//       text: function(d, i) {
//         if (i === 0) return 'min: ' + d3.min(values);
//         if (i === data.length - 1) return 'max: ' + d3.max(values);
//         return '';
//       }
//     };
//   }
//
//   var chart = many()
//     .width(width)
//     .height(height - 10)
//     .options({
//       scale: true,
//       bgbars: false,
//       labels: labels,
//       view: opts.view
//     });
//
//   d3.select(g)
//     .datum(data)
//     .call(chart);
//
//   // simulate data changes
//   // setInterval(function() {
//   //   _.each(data, function(d) {
//   //     d.count = _.random(0, 20);
//   //   });
//   //   d3.select(g).call(chart);
//   // }, 500);
//
//   // many(data, opts.view, g, width, height - 10, {
//   //   scale: true,
//   //   bgbars: false,
//   //   labels: labels
//   // });
// };
//
module.exports = minicharts_d3fns_number;
