var d3 = require('d3');
var _ = require('lodash');
var many = require('./many');
var shared = require('./shared');
var tooltipHtml = require('./tooltip.jade');
var debug = require('debug')('scout-ui:minicharts:number');

module.exports = function(opts) {
  var values = opts.data.values.toJSON();

  var margin = shared.margin;
  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  if (opts.data.unique < 20) {
    var data = _(values)
      .groupBy(function(d) {
        return d;
      })
      .map(function(v, k) {
        v.label = k;
        v.value = v.length;
        return v;
      })
      .value();

  } else {
    // use the linear scale just to get nice binning values
    var x = d3.scale.linear()
      .domain(d3.extent(values))
      .range([0, width]);

    // Generate a histogram using approx. twenty uniformly-spaced bins
    var ticks = x.ticks(20);
    var hist = d3.layout.histogram()
      .bins(ticks);

    var data = hist(values);
    var sumY = d3.sum(_.pluck(data, 'y'));

    _.each(data, function(d, i) {
      var label;
      if (i === 0) {
        label = '< ' + (d.x + d.dx);
      } else if (i === data.length - 1) {
        label = '&ge; ' + d.x;
      } else {
        label = d.x + '-' + (d.x + d.dx);
      }
      // remapping keys to conform with all other types
      d.value = d.y;
      d.label = label;
    });
  }

  // clear element first
  d3.select(el).selectAll('*').remove();

  var g = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  var labels;
  if (opts.data.unique < 20) {
    labels = true;
  } else {
    labels = {
      text: function(d, i) {
        if (i === 0) return 'min: ' + d3.min(values);
        if (i === data.length - 1) return 'max: ' + d3.max(values);
        return '';
      }
    };
  }

  many(data, g, width, height - 10, {
    scale: true,
    bgbars: false,
    labels: labels
  });
};

