/* eslint no-use-before-define: 0, camelcase: 0 */
import d3 from 'd3';
import { map, minBy, maxBy, sortBy } from 'lodash';
import shared from './shared';
import { hasDistinctValue, inValueRange } from 'mongodb-query-util';
import { createD3Tip } from './create-d3-tip';

const minicharts_d3fns_many = (appRegistry) => {
  // --- beginning chart setup ---
  let width = 400; // default width
  let height = 100; // default height
  let el;
  let lastNonShiftRangeValue = null;

  const options = {
    bgbars: false,
    scale: false,
    labels: false, // label defaults will be set further below
    selectable: true, // setting to false disables query builder for this chart
    selectionType: 'distinct', //  can be `distinct` or `range`
  };

  const xScale = d3.scale.ordinal();
  const yScale = d3.scale.linear();
  const labelScale = d3.scale.ordinal();

  // set up tooltips
  const tip = createD3Tip();
  const brush = d3.svg.brush().on('brush', brushed).on('brushend', brushend);
  // --- end chart setup ---

  function handleDrag() {
    // ignore this event when shift is pressed for distinct selections.
    // multiple unconnected $in ranges are not supported yet
    if (d3.event.shiftKey) {
      return;
    }
    const bars = el.selectAll('rect.selectable');
    const numSelected = el.selectAll('rect.selectable.selected')[0].length;
    const s = brush.extent();
    // add `unselected` class to all elements
    bars.classed('unselected', true);
    // get elements within the brush
    const selected = bars.filter(function (d) {
      const left = xScale(d.label);
      const right = left + xScale.rangeBand();
      return s[0] <= right && left <= s[1];
    });
    // add `selected` class and remove `unselected` class
    selected.classed('selected', true);
    selected.classed('unselected', false);

    // if selection has changed, trigger query builder event
    if (numSelected !== selected[0].length) {
      if (selected[0].length === 0) {
        // clear value
        appRegistry.emit('query-bar-change-filter', {
          type: 'clearValue',
          payload: { field: options.fieldName },
        });
        return;
      }
      // distinct values (strings)
      if (options.selectionType === 'distinct') {
        const values = map(selected.data(), 'value');
        appRegistry.emit('query-bar-change-filter', {
          type: 'setDistinctValues',
          payload: {
            field: options.fieldName,
            value: values.map((v) => options.promoter(v)),
          },
        });
        return;
      }
      // numeric types
      const minValue = minBy(selected.data(), function (d) {
        return d.value;
      });
      const maxValue = maxBy(selected.data(), function (d) {
        return d.value;
      });

      if (minValue.value === maxValue.value + maxValue.dx) {
        // if not binned and values are the same, single equality query
        appRegistry.emit('query-bar-change-filter', {
          type: 'setValue',
          payload: {
            field: options.fieldName,
            value: options.promoter(minValue.bson),
          },
        });
        return;
      }
      // binned values, build range query with $gte and $lt (if binned)
      // or $gte and $lte (if not binned)
      appRegistry.emit('query-bar-change-filter', {
        type: 'setRangeValues',
        payload: {
          field: options.fieldName,
          min: options.promoter(minValue.value),
          max: options.promoter(maxValue.value + maxValue.dx),
          maxInclusive: maxValue.dx === 0,
        },
      });
    }
  }

  function brushed() {
    handleDrag();
  }

  function brushend() {
    d3.select(this).call(brush.clear());
  }

  /**
   * Handles event of single mousedown (either as click, or beginning of a
   * brush drag event).
   *
   * For distinct (non-numeric values), the behavior is this:
   * - If shift is pressed: toggle the value (selected if it was unselected,
   *   and vice versa)
   * - If shift is not pressed: set the value to selected one, unless already
   *   selected, in which case unselect all values.
   *
   * For ranges (numeric values), the behavior is this:
   * - If the bar represents a single value (not binned), create a single value
   *   equality query, e.g. {"field": 16}.
   * - If the bar represents a range (binned), create a $gte / $lt range query,
   *   e.g. {"field": {"$gte": 20, "$lt": 25}} for a bin size of 5.
   *
   * @param  {Document} d    the data associated with the clicked bar
   */
  function handleMouseDown(d) {
    if (!options.selectable) {
      return;
    }

    if (options.selectionType === 'distinct') {
      // distinct values, behavior dependent on shift key
      appRegistry.emit('query-bar-change-filter', {
        type: d3.event.shiftKey ? 'toggleDistinctValue' : 'setValue',
        payload: {
          field: options.fieldName,
          value: options.promoter(d.value),
          unsetIfSet: true,
        },
      });
    } else if (d3.event.shiftKey && lastNonShiftRangeValue) {
      appRegistry.emit('query-bar-change-filter', {
        type: 'setRangeValues',
        payload: {
          field: options.fieldName,
          min: options.promoter(
            Math.min(d.value, lastNonShiftRangeValue.value)
          ),
          max: options.promoter(
            Math.max(
              d.value + d.dx,
              lastNonShiftRangeValue.value + lastNonShiftRangeValue.dx
            )
          ),
          maxInclusive: d.dx === 0,
        },
      });
    } else {
      // remember non-shift value so that range can be extended with shift
      lastNonShiftRangeValue = d;
      if (d.dx > 0) {
        // binned bars, turn single value into range
        appRegistry.emit('query-bar-change-filter', {
          type: 'setRangeValues',
          payload: {
            field: options.fieldName,
            min: options.promoter(d.value),
            max: options.promoter(d.value + d.dx),
            unsetIfSet: true,
          },
        });
      } else {
        // bars don't represent bins, build single value query
        appRegistry.emit('query-bar-change-filter', {
          type: 'setValue',
          payload: {
            field: options.fieldName,
            value: options.promoter(d.bson),
            unsetIfSet: true,
          },
        });
      }
    }

    const parent = this.closest('.minichart');
    const background = parent.querySelector('g.brush > rect.background');
    const brushNode = parent.querySelector('g.brush');

    const start = d3.mouse(background)[0];

    const w = d3
      .select(window)
      .on('mousemove', mousemove)
      .on('mouseup', mouseup);

    d3.event.preventDefault(); // disable text dragging

    function mousemove() {
      const extent = [start, d3.mouse(background)[0]];
      d3.select(brushNode).call(brush.extent(sortBy(extent)));
      brushed.call(brushNode);
    }

    function mouseup() {
      w.on('mousemove', null).on('mouseup', null);
      brushend.call(brushNode);
    }
  }

  function selectFromQuery(bars) {
    if (options.query === undefined) {
      bars.classed('unselected', false);
      bars.classed('selected', false);
      bars.classed('half', false);
      return;
    }
    // handle distinct selections
    if (options.selectionType === 'distinct') {
      bars.each(function (d) {
        d.hasDistinct = hasDistinctValue(options.query, d.value);
      });
      bars.classed('selected', function (d) {
        return d.hasDistinct;
      });
      bars.classed('unselected', function (d) {
        return !d.hasDistinct;
      });
    } else if (options.selectionType === 'range') {
      bars.each(function (d) {
        d.inRange = inValueRange(options.query, d);
      });
      bars.classed('selected', function (d) {
        return d.inRange === 'yes';
      });
      bars.classed('half-selected', function (d) {
        return d.inRange === 'partial';
      });
      bars.classed('unselected', function (d) {
        return d.inRange === 'no';
      });
    }
  }

  function chart(selection) {
    /* eslint complexity: 0 */
    selection.each(function (data) {
      const values = map(data, 'count');
      const maxValue = d3.max(values);
      const sumValues = d3.sum(values);
      const percentFormat = shared.friendlyPercentFormat(
        (maxValue / sumValues) * 100
      );
      let labels = options.labels;
      el = d3.select(this);

      xScale.domain(map(data, 'label')).rangeRoundBands([0, width], 0.3, 0.0);

      brush.x(xScale);
      brush.extent(brush.extent());

      yScale.domain([0, maxValue]).range([height, 0]);

      // set label defaults
      if (options.labels) {
        labels = {
          'text-anchor': function (d, i) {
            if (i === 0) {
              return 'start';
            }
            if (i === data.length - 1) {
              return 'end';
            }
            return 'middle';
          },
          x:
            labels['text-anchor'] === 'middle'
              ? xScale.rangeBand() / 2
              : function (d, i) {
                  if (i === 0) {
                    return 0;
                  }
                  if (i === data.length - 1) {
                    return xScale.rangeBand();
                  }
                  return xScale.rangeBand() / 2;
                },
          y: height + 5,
          dy: '0.75em',
          text: function (d) {
            return d.count;
          },
          ...labels,
        };
      }

      // setup tool tips
      tip.html(function (d, i) {
        if (typeof d.tooltip === 'function') {
          return d.tooltip(d, i);
        }
        return (
          d.tooltip ||
          shared.tooltip(
            shared.truncateTooltip(d.label),
            percentFormat((d.count / sumValues) * 100)
          )
        );
      });
      el.call(tip);

      // draw scale labels and lines if requested
      if (options.scale) {
        const triples = function (v) {
          return [v, v / 2, 0];
        };

        const scaleLabels = map(
          triples((maxValue / sumValues) * 100),
          function (x) {
            return percentFormat(x, true);
          }
        );

        labelScale.domain(scaleLabels).rangePoints([0, height]);

        const legend = el.selectAll('g.legend').data(scaleLabels);

        // create new legend elements
        const legendEnter = legend.enter().append('g').attr('class', 'legend');

        legendEnter
          .append('text')
          .attr('x', 0)
          .attr('dx', '-1em')
          .attr('dy', '0.3em')
          .attr('text-anchor', 'end');

        legendEnter
          .append('line')
          .attr('class', 'bg')
          .attr('x1', -5)
          .attr('y1', 0)
          .attr('y2', 0);

        // update legend elements
        legend.attr('transform', function (d) {
          return 'translate(0, ' + labelScale(d) + ')';
        });

        legend.select('text').text(function (d) {
          return d;
        });

        legend.select('line').attr('x2', width);

        legend.exit().remove();
      }

      if (options.selectable) {
        const gBrush = el.selectAll('.brush').data([0]);
        gBrush
          .enter()
          .append('g')
          .attr('class', 'brush')
          .call(brush)
          .selectAll('rect')
          .attr('y', 0)
          .attr('height', height);
      }

      // select all g.bar elements
      const bar = el.selectAll('.bar').data(data, function (d) {
        return d.label; // identify data by its label
      });

      // create new bar elements as needed
      const barEnter = bar.enter().append('g').attr('class', 'bar');

      bar.attr('transform', function (d) {
        return 'translate(' + xScale(d.label) + ', 0)';
      });

      // if background bars are used, fill whole area with background bar color first
      if (options.bgbars) {
        barEnter.append('rect').attr('class', 'bg');
      }

      // now attach the foreground bars
      barEnter
        .append('rect')
        .attr('class', options.selectable ? 'fg selectable' : 'fg')
        .attr('x', 0);

      // create mouseover and click handlers
      if (options.bgbars) {
        // ... on a separate front "glass" pane if we use background bars
        barEnter
          .append('rect')
          .attr('class', 'glass')
          .attr('width', xScale.rangeBand())
          .attr('height', height)
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);
      } else {
        // ... or attach tooltips directly to foreground bars if we don't use background bars
        barEnter
          .selectAll('.fg')
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);

        if (options.selectable) {
          barEnter.selectAll('.selectable').on('mousedown', handleMouseDown);
        }
      }

      if (options.labels) {
        barEnter
          .append('text')
          .attr('x', labels.x)
          .attr('dx', labels.dx)
          .attr('y', labels.y)
          .attr('dy', labels.dy)
          .attr('text-anchor', labels['text-anchor']);
      }

      // now update _all_ bar elements (old and new) based on changes
      // in data and width/height
      bar
        .selectAll('.bg')
        .attr('width', xScale.rangeBand())
        .attr('height', height);

      bar
        .selectAll('.fg')
        // .transition()
        .attr('y', function (d) {
          return yScale(d.count);
        })
        .attr('width', xScale.rangeBand())
        .attr('height', function (d) {
          return height - yScale(d.count);
        });

      if (options.labels) {
        bar.select('text').text(labels.text);
      } else {
        bar.select('text').remove();
      }

      // finally remove obsolete bar elements
      bar.exit().remove();

      // unset the non-shift clicked bar marker if the query is empty
      if (options.query === undefined) {
        lastNonShiftRangeValue = null;
      }

      // paint remaining bars in correct color
      el.selectAll('rect.selectable').call(selectFromQuery);
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
    tip.destroy();
    return chart;
  };

  return chart;
};

export default minicharts_d3fns_many;
