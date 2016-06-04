/* eslint camelcase: 0 */
const d3 = require('d3');
const _ = require('lodash');
const many = require('./many');
const shared = require('./shared');
// const debug = require('debug')('mongodb-compass:minicharts:number');

const minicharts_d3fns_number = function() {
  let width = 400;
  let height = 100;
  const options = {
    view: null
  };
  const margin = shared.margin;
  const xBinning = d3.scale.linear();
  const manyChart = many();

  function chart(selection) {
    selection.each(function(data) {
      let grouped;
      const el = d3.select(this);
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // transform data
      if (options.unique < 20) {
        grouped = _(data)
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
          .sortBy(function(v) {
            return v.value;
          })
          .value();
      } else {
        // use the linear scale just to get nice binning values
        xBinning
          .domain(d3.extent(data))
          .range([0, innerWidth]);

        // Generate a histogram using approx. twenty uniformly-spaced bins
        const ticks = xBinning.ticks(20);
        const hist = d3.layout.histogram()
          .bins(ticks);

        grouped = hist(data);

        _.each(grouped, function(d, i) {
          let label;
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

      const g = el.selectAll('g').data([grouped]);

      // append g element if it doesn't exist yet
      g.enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      let labels;
      if (options.unique < 20) {
        labels = true;
      } else {
        labels = {
          text: function(d, i) {
            if (i === 0) {
              return 'min: ' + d3.min(data);
            }
            if (i === grouped.length - 1) {
              return 'max: ' + d3.max(data);
            }
            return '';
          }
        };
      }

      options.labels = labels;
      options.scale = true;
      options.selectionType = 'range';

      manyChart
        .width(innerWidth)
        .height(innerHeight - 10)
        .options(options);

      g.call(manyChart);
    });
  }

  chart.width = function(value) {
    if (!arguments.length) {
      return width;
    }
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) {
      return height;
    }
    height = value;
    return chart;
  };

  chart.options = function(value) {
    if (!arguments.length) {
      return options;
    }
    _.assign(options, value);
    return chart;
  };

  return chart;
};

module.exports = minicharts_d3fns_number;
