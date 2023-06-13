/* eslint camelcase: 0 */
import d3 from 'd3';
import { groupBy } from 'lodash';
import { map } from 'lodash';
import { orderBy } from 'lodash';
import few from './few';
import shared from './shared';

const minicharts_d3fns_boolean = (localAppRegistry) => {
  // --- beginning chart setup ---
  let width = 400;
  let height = 100;
  const options = {
    view: null,
  };
  const fewChart = few(localAppRegistry);
  const margin = shared.margin;
  // --- end chart setup ---

  function chart(selection) {
    selection.each(function (data) {
      const el = d3.select(this);
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      // group by true/false
      const gr = groupBy(data, function (d) {
        return d;
      });
      const grd = { false: [], true: [], ...gr };
      const grdm = map(grd, function (v, k) {
        return {
          label: k,
          value: k === 'true',
          count: v.length,
        };
      });

      const grouped = orderBy(grdm, ['label'], ['desc']);

      fewChart.width(innerWidth).height(innerHeight).options(options);

      const g = el.selectAll('g').data([grouped]);

      // append g element if it doesn't exist yet
      g.enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      g.call(fewChart);
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
    return chart;
  };

  return chart;
};

export default minicharts_d3fns_boolean;
