/* eslint camelcase: 0 */
import d3 from 'd3';
import { map, groupBy, orderBy } from 'lodash';
import few from './few';
import many from './many';
import shared from './shared';

const minicharts_d3fns_string = (appRegistry) => {
  // --- beginning chart setup ---
  let width = 400;
  let height = 100;
  const options = {
    query: {},
  };

  const manyChart = many(appRegistry);
  const fewChart = few(appRegistry);
  const margin = shared.margin;
  // --- end chart setup ---

  function chart(selection) {
    selection.each(function (data) {
      const el = d3.select(this);
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // group into labels and values per bucket, sort descending
      const gr = groupBy(data, function (d) {
        return d;
      });
      const grm = map(gr, function (v, k) {
        return {
          label: k,
          value: k,
          count: v.length,
        };
      });

      const grouped = orderBy(grm, ['count'], ['desc']);

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

      chartFn.width(innerWidth).height(innerHeight).options(options);

      g.call(chartFn);
    });
  }

  chart.width = function (value) {
    if (!arguments.length) {
      return width;
    }
    width = value;
    return chart;
  };

  chart.height = function (value) {
    if (!arguments.length) {
      return height;
    }
    height = value;
    return chart;
  };

  chart.options = function (value) {
    if (!arguments.length) {
      return options;
    }
    Object.assign(options, value);
    return chart;
  };

  chart.cleanup = function () {
    fewChart.cleanup();
    manyChart.cleanup();
    return chart;
  };

  return chart;
};

export default minicharts_d3fns_string;
