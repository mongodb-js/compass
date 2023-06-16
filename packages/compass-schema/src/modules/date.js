/* eslint-disable no-use-before-define */
import d3 from 'd3';
import { isEqual, range, minBy, maxBy, sortBy, groupBy, map } from 'lodash';
import moment from 'moment';
import { inValueRange } from 'mongodb-query-util';
import { palette, spacing } from '@mongodb-js/compass-components';

import shared from './shared';
import many from './many';
import { createD3Tip } from './create-d3-tip';

function generateDefaults(n) {
  const doc = {};
  range(n).forEach(function (d) {
    doc[d] = [];
  });
  return doc;
}

function extractTimestamp(d) {
  return d._bsontype === 'ObjectId' ? d.getTimestamp() : d;
}

const minicharts_d3fns_date = (appRegistry) => {
  // --- beginning chart setup ---
  let width = 400;
  let height = 100;
  let el;
  let lastNonShiftRangeValue = null;

  const upperRatio = 2.5;
  const upperMargin = 20;
  const options = {};
  const subcharts = [];

  const weekdayLabels = moment.weekdays();

  // A formatter for dates
  const format = d3.time.format.utc('%Y-%m-%d %H:%M:%S');

  const margin = shared.margin;
  const barcodeX = d3.time.scale();

  // set up tooltips
  const tip = createD3Tip().html(function (d) {
    return d.label;
  });

  const brush = d3.svg
    .brush()
    .x(barcodeX)
    .on('brush', brushed)
    .on('brushend', brushend);

  function handleDrag() {
    const lines = el.selectAll('line.selectable');
    const numSelected = el.selectAll('line.selectable.selected').length;
    const s = brush.extent();

    // add `unselected` class to all elements
    lines.classed('unselected', true);
    lines.classed('selected', false);

    // get elements within the brush
    const selected = lines.filter(function (d) {
      return s[0] <= d.ts && d.ts <= s[1];
    });

    // add `selected` class and remove `unselected` class
    selected.classed('selected', true);
    selected.classed('unselected', false);

    if (numSelected !== selected[0].length) {
      // number of selected items has changed, trigger querybuilder event
      if (selected[0].length === 0) {
        // clear value
        appRegistry.emit('query-bar-change-filter', {
          type: 'clearValue',
          payload: {
            field: options.fieldName,
          },
        });
        return;
      }
    }

    const minValue = minBy(selected.data(), function (d) {
      return d.ts;
    });
    const maxValue = maxBy(selected.data(), function (d) {
      return d.ts;
    });

    if (isEqual(minValue.ts, maxValue.ts)) {
      appRegistry.emit('query-bar-change-filter', {
        type: 'setValue',
        payload: {
          field: options.fieldName,
          value: minValue.value,
        },
      });
      return;
    }

    // binned values, build range query with $gte and $lte
    appRegistry.emit('query-bar-change-filter', {
      type: 'setRangeValues',
      payload: {
        field: options.fieldName,
        min: minValue.value,
        max: maxValue.value,
        maxInclusive: true,
      },
    });
  }

  function brushed() {
    handleDrag();
  }

  function brushend() {
    d3.select(this).call(brush.clear());
  }

  function handleMouseDown(d) {
    if (d3.event.shiftKey && lastNonShiftRangeValue) {
      const minVal =
        d.ts < lastNonShiftRangeValue.ts
          ? d.value
          : lastNonShiftRangeValue.value;
      const maxVal =
        d.ts > lastNonShiftRangeValue.ts
          ? d.value
          : lastNonShiftRangeValue.value;
      appRegistry.emit('query-bar-change-filter', {
        type: 'setRangeValues',
        payload: {
          field: options.fieldName,
          min: minVal,
          max: maxVal,
          maxInclusive: true,
        },
      });
    } else {
      // remember non-shift value so that range can be extended with shift
      lastNonShiftRangeValue = d;
      appRegistry.emit('query-bar-change-filter', {
        type: 'setValue',
        payload: {
          field: options.fieldName,
          value: d.value,
          unsetIfSet: true,
        },
      });
    }

    const parent = this.closest('.minichart');
    const background = parent.querySelector('g.brush > rect.background');
    const brushNode = parent.querySelector('g.brush');
    const start = barcodeX.invert(d3.mouse(background)[0]);

    const w = d3
      .select(window)
      .on('mousemove', mousemove)
      .on('mouseup', mouseup);

    d3.event.preventDefault(); // disable text dragging

    function mousemove() {
      const extent = [start, barcodeX.invert(d3.mouse(background)[0])];
      d3.select(brushNode).call(brush.extent(sortBy(extent)));
      brushed.call(brushNode);
    }

    function mouseup() {
      // bar.classed('selected', true);
      w.on('mousemove', null).on('mouseup', null);
      brushend.call(brushNode);
    }
  }

  function selectFromQuery(lines) {
    if (options.query === undefined) {
      lines.classed('unselected', false);
      lines.classed('selected', false);
      lines.classed('half', false);
      return;
    }
    lines.each(function (d) {
      d.inRange = inValueRange(options.query, d);
    });

    lines.classed('selected', function (d) {
      return d.inRange === 'yes';
    });
    lines.classed('unselected', function (d) {
      return d.inRange === 'no';
    });
  }

  function chart(selection) {
    selection.each(function (data) {
      const values = data.map(function (d) {
        const ts = extractTimestamp(d);
        return {
          label: format(ts),
          ts: ts,
          value: d,
          count: 1,
        };
      });

      // without `-1` the tooltip won't always trigger on the rightmost value
      const innerWidth = width - margin.left - margin.right - 1;
      const innerHeight = height - margin.top - margin.bottom;
      el = d3.select(this);

      const barcodeTop = Math.floor(innerHeight / 2 + 15);
      const barcodeBottom = Math.floor(innerHeight - 10);

      const upperBarBottom = innerHeight / 2 - 20;

      barcodeX
        .domain(
          d3.extent(values, function (d) {
            return d.ts;
          })
        )
        .range([0, innerWidth]);

      // group by weekdays
      const w = groupBy(values, function (d) {
        return moment(d.ts).weekday();
      });
      const wd = { ...generateDefaults(7), ...w };
      const weekdays = map(wd, function (d, i) {
        return {
          label: weekdayLabels[i],
          count: d.length,
        };
      });

      // group by hours
      const hourLabels = d3.range(24);
      const h = groupBy(values, function (d) {
        return d.ts.getHours();
      });
      const hd = { ...generateDefaults(24), ...h };
      const hours = map(hd, function (d, i) {
        return {
          label: hourLabels[i] + ':00',
          count: d.length,
        };
      });

      el.call(tip);

      const g = el.selectAll('g').data([data]);

      const gEnter = g
        .enter()
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      gEnter
        .append('g')
        .attr('class', 'weekday')
        .append('g')
        .attr('transform', `translate(${-spacing[4] + spacing[1]} ${0})`)
        .append('svg')
        .attr('width', 15)
        .attr('height', 13)
        .attr('viewBox', '0 0 18 16')
        .attr('fill', 'none')
        .append('path')
        .attr('fill-rule', 'evenodd')
        .attr('clip-rule', 'evenodd')
        // SVG glyph 'Calendar' from LeafyGreen.
        .attr(
          'd',
          'M5 2C5 1.44772 5.44772 1 6 1C6.55228 1 7 1.44772 7 2V3C7 3.55228 6.55228 4 6 4C5.44772 4 5 3.55228 5 3V2ZM10 3H8C8 4.10457 7.10457 5 6 5C4.89543 5 4 4.10457 4 3C2.89543 3 2 3.89543 2 5V12C2 13.1046 2.89543 14 4 14H14C15.1046 14 16 13.1046 16 12V5C16 3.89543 15.1046 3 14 3C14 4.10457 13.1046 5 12 5C10.8954 5 10 4.10457 10 3ZM11 3C11 3.55228 11.4477 4 12 4C12.5523 4 13 3.55228 13 3V2C13 1.44772 12.5523 1 12 1C11.4477 1 11 1.44772 11 2V3ZM13 7H10V10H13V7Z'
        )
        .attr('fill', palette.gray.base);

      gEnter
        .append('g')
        .attr('class', 'hour')
        .append('g')
        .attr('transform', `translate(${-spacing[3]} ${0})`)
        .append('svg')
        .attr('width', 13)
        .attr('height', 13)
        .attr('viewBox', '0 0 16 16')
        .attr('fill', 'none')
        .append('path')
        .attr('fill-rule', 'evenodd')
        .attr('clip-rule', 'evenodd')
        // SVG glyph 'Clock' from LeafyGreen.
        .attr(
          'd',
          'M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14ZM7.25 4.75C7.25 4.33579 7.58579 4 8 4C8.41421 4 8.75 4.33579 8.75 4.75V7.90966L10.4939 9.43556C10.8056 9.70832 10.8372 10.1821 10.5644 10.4939C10.2917 10.8056 9.81786 10.8372 9.50613 10.5644L7.51059 8.81833C7.5014 8.8104 7.4924 8.80226 7.48361 8.79391C7.41388 8.7278 7.35953 8.65117 7.32087 8.56867C7.27541 8.47195 7.25 8.36394 7.25 8.25V4.75Z'
        )
        .attr('fill', palette.gray.base);

      el.select('.hour').attr(
        'transform',
        'translate(' + (innerWidth / (upperRatio + 1) + upperMargin) + ', 0)'
      );

      const gBrush = g.selectAll('.brush').data([0]);
      gBrush
        .enter()
        .append('g')
        .attr('class', 'brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', barcodeTop)
        .attr('height', barcodeBottom - barcodeTop);

      gEnter.append('g').attr('class', 'line-container');

      const lines = g
        .select('.line-container')
        .selectAll('.selectable')
        .data(values, function (d) {
          return d.ts;
        });

      lines
        .enter()
        .append('line')
        .attr('class', 'line selectable')
        .style('opacity', function () {
          return lines.size() > 200 ? 0.3 : 1.0;
        })
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on('mousedown', handleMouseDown);

      // disabling direct onClick handler in favor of click-drag
      //   .on('click', handleClick);

      lines
        .attr('y1', barcodeTop)
        .attr('y2', barcodeBottom)
        .attr('x2', function (d) {
          return barcodeX(d.ts);
        })
        .attr('x1', function (d) {
          return barcodeX(d.ts);
        });

      lines.exit().remove();

      // unset the non-shift clicked bar marker if the query is empty
      if (options.query === undefined) {
        lastNonShiftRangeValue = null;
      }

      // paint remaining lines in correct color
      el.selectAll('line.selectable').call(selectFromQuery);

      const text = g.selectAll('.text').data(barcodeX.domain());

      text
        .enter()
        .append('text')
        .attr('class', 'text')
        .attr('dy', '0.75em')
        .attr('y', barcodeBottom + 5);

      text
        .attr('x', function (d, i) {
          return i * innerWidth;
        })
        .attr('text-anchor', function (d, i) {
          return i ? 'end' : 'start';
        })
        .text(function (d, i) {
          if (format(barcodeX.domain()[0]) === format(barcodeX.domain()[1])) {
            if (i === 0) {
              return 'inserted: ' + format(d);
            }
          } else {
            return (i ? 'last: ' : 'first: ') + format(d);
          }
        });

      text.exit().remove();

      let chartWidth = innerWidth / (upperRatio + 1) - upperMargin;
      const weekdayContainer = g.select('g.weekday').data([weekdays]);
      const manyDayChart = many(appRegistry)
        .width(chartWidth)
        .height(upperBarBottom)
        .options({
          selectable: false,
          bgbars: true,
          labels: {
            'text-anchor': 'middle',
            text: function (d) {
              return d.label[0];
            },
          },
        });
      weekdayContainer.call(manyDayChart);
      subcharts.push(manyDayChart);

      chartWidth = (innerWidth / (upperRatio + 1)) * upperRatio - upperMargin;
      const hourContainer = g.select('g.hour').data([hours]);
      const manyHourChart = many(appRegistry)
        .width(chartWidth)
        .height(upperBarBottom)
        .options({
          selectable: false,
          bgbars: true,
          labels: {
            text: function (d, i) {
              return i % 6 === 0 || i === 23 ? d.label : '';
            },
          },
        });
      hourContainer.call(manyHourChart);
      subcharts.push(manyHourChart);
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
    // eslint-disable-next-line no-unused-vars
    for (const subchart of subcharts) {
      subchart.cleanup();
    }
    tip.destroy();
    return chart;
  };

  return chart;
};

export default minicharts_d3fns_date;
