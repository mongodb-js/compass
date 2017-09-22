/* eslint camelcase: 0 */
const d3 = require('d3');
const _ = require('lodash');
const few = require('./few');
const many = require('./many');
const shared = require('./shared');

const minicharts_d3fns_string = function() {
  // --- beginning chart setup ---
  let width = 400;
  let height = 100;
  const options = {
    query: {}
  };

  const manyChart = many();
  const fewChart = few();
  const margin = shared.margin;
  // --- end chart setup ---

  function chart(selection) {
    selection.each(function(data) {
      const el = d3.select(this);
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // group into labels and values per bucket, sort descending
      const grouped = _(data)
        .groupBy(function(d) {
          return d;
        })
        .map(function(v, k) {
          return {
            label: k,
            value: k,
            count: v.length
          };
        })
        .sortByOrder('count', [false]) // descending on value
        .value();

      const g = el.selectAll('g').data([grouped]);

      // append g element if it doesn't exist yet
      g.enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .attr('width', innerWidth)
        .attr('height', innerHeight);

      const chartFn = grouped.length <= 5 ? fewChart : manyChart;
      options.scale = true;
      options.selectionType = 'distinct';

      chartFn
        .width(innerWidth)
        .height(innerHeight)
        .options(options);

      g.call(chartFn);
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

module.exports = minicharts_d3fns_string;
