/* eslint no-use-before-define: 0, camelcase: 0 */
const app = require('hadron-app');
const d3 = require('d3');
const $ = require('jquery');
const _ = require('lodash');
const shared = require('./shared');
const hasDistinctValue = require('../../../query/lib/util').hasDistinctValue;

// const debug = require('debug')('mongodb-compass:minicharts:few');

require('./d3-tip')(d3);


const minicharts_d3fns_few = function() {
  // --- beginning chart setup ---
  let width = 400; // default width
  let height = 100; // default height
  let el;

  const QueryAction = app.appRegistry.getAction('Query.Actions');

  const barHeight = 25;
  const brushHeight = 80;
  const options = {};

  const xScale = d3.scale.linear();

  // set up tooltips
  const tip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('n')
    .offset([-9, 0]);
  const brush = d3.svg.brush()
    .x(xScale)
    .on('brush', brushed)
    .on('brushend', brushend);
    // --- end chart setup ---

  function handleDrag() {
    // ignore this event when shift is pressed, only works for single clicks
    if (d3.event.shiftKey) {
      return;
    }
    const bars = el.selectAll('rect.selectable');
    const numSelected = el.selectAll('rect.selectable.selected')[0].length;
    const s = brush.extent();
    // add `unselected` class to all elements
    bars.classed('unselected', true);
    // get elements within the brush
    const selected = bars.filter(function(d) {
      const left = d.xpos;
      const right = left + d.count;
      return s[0] <= right && left <= s[1];
    });
    // add `selected` class and remove `unselected` class
    selected.classed('selected', true);
    selected.classed('unselected', false);

    // if selection has changed, trigger query builder event
    if (numSelected !== selected[0].length) {
      const values = _.map(selected.data(), 'value');
      QueryAction.setDistinctValues({
        field: options.fieldName,
        value: values.map((v) => options.promoter(v))
      });
    }
  }

  function brushed() {
    handleDrag();
  }

  function brushend() {
    d3.select(this).call(brush.clear());
  }

  function handleMouseDown(d) {
    const parent = $(this).closest('.minichart');
    const background = parent.find('g.brush > rect.background')[0];
    const brushNode = parent.find('g.brush')[0];
    const start = xScale.invert(d3.mouse(background)[0]);


    const qbAction = d3.event.shiftKey ?
      QueryAction.toggleDistinctValue : QueryAction.setValue;
    qbAction({
      field: options.fieldName,
      value: options.promoter(d.value),
      unsetIfSet: true
    });

    const w = d3.select(window)
      .on('mousemove', mousemove)
      .on('mouseup', mouseup);

    d3.event.preventDefault(); // disable text dragging

    function mousemove() {
      const extent = [start, xScale.invert(d3.mouse(background)[0])];
      d3.select(brushNode).call(brush.extent(_.sortBy(extent)));
      brushed.call(brushNode);
    }

    function mouseup() {
      w.on('mousemove', null).on('mouseup', null);
      brushend.call(brushNode);
    }
  }

  function selectFromQuery(bars) {
    // handle distinct selections
    if (options.query === undefined) {
      bars.classed('unselected', false);
      bars.classed('selected', false);
      bars.classed('half', false);
      return;
    }
    bars.classed('selected', function(d) {
      return hasDistinctValue(options.query, d.value);
    });
    bars.classed('unselected', function(d) {
      return !hasDistinctValue(options.query, d.value);
    });
  }

  function chart(selection) {
    selection.each(function(data) {
      _.each(data, (d, i) => {
        data[i].xpos = _.sum(_(data)
          .slice(0, i)
          .map('count')
          .value()
        );
      });
      const values = _.map(data, 'count');
      const sumValues = d3.sum(values);
      const maxValue = d3.max(values);
      const percentFormat = shared.friendlyPercentFormat(maxValue / sumValues * 100);
      el = d3.select(this);

      xScale
        .domain([0, sumValues])
        .range([0, width]);

      // setup tool tips
      tip.html(function(d, i) {
        if (typeof d.tooltip === 'function') {
          return d.tooltip(d, i);
        }
        return d.tooltip || shared.tooltip(shared.truncateTooltip(d.label), percentFormat(d.count / sumValues * 100));
      });
      el.call(tip);

      const gBrush = el.selectAll('.brush').data([0]);
      gBrush.enter().append('g')
        .attr('class', 'brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', (height - brushHeight) / 2)
        .attr('height', brushHeight);

      // select all g.bar elements
      const bar = el.selectAll('g.bar')
        .data(data, function(d) {
          return d.label; // identify data by its label
        });

      bar
        .attr('transform', function(d) {
          return 'translate(' + xScale(d.xpos) + ', ' + (height - barHeight) / 2 + ')';
        });

      const barEnter = bar.enter().append('g')
        .attr('class', 'bar few')
        .attr('transform', function(d) { // repeat transform attr here but without transition
          return 'translate(' + xScale(d.xpos) + ', ' + (height - barHeight) / 2 + ')';
        })
        .on('mousedown', handleMouseDown);

      barEnter.append('rect')
        .attr('class', function(d, i) {
          return 'selectable fg fg-' + i;
        })
        .attr('y', 0)
        .attr('x', 0)
        .attr('height', barHeight);

      barEnter.append('text')
        .attr('y', barHeight / 2)
        .attr('dy', '0.3em')
        .attr('dx', 10)
        .attr('text-anchor', 'start')
        .attr('fill', 'white');

      barEnter.append('rect')
        .attr('class', 'glass')
        .attr('y', 0)
        .attr('x', 0)
        .attr('height', barHeight)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

      bar.select('rect.selectable')
        .attr('width', function(d) {
          return xScale(d.count);
        });

      bar.select('rect.glass')
        .attr('width', function(d) {
          return xScale(d.count);
        });

      bar.select('text')
        .text(function(d) {
          return d.label;
        });

      bar.exit().remove();

      // paint remaining bars in correct color
      el.selectAll('rect.selectable').call(selectFromQuery);
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

module.exports = minicharts_d3fns_few;
