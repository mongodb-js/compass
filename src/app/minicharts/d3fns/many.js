/* eslint no-use-before-define: 0, camelcase: 0 */
var d3 = require('d3');
var $ = require('jquery');
var _ = require('lodash');
var shared = require('./shared');

var tooltipTemplate = require('../../templates').minicharts.d3fns.tooltip;
// var debug = require('debug')('mongodb-compass:minicharts:many');

require('../d3-tip')(d3);

var minicharts_d3fns_many = function() {
  // --- beginning chart setup ---
  var width = 400; // default width
  var height = 100; // default height
  var options = {
    view: null,
    bgbars: false,
    scale: false,
    labels: false, // label defaults will be set further below
    selectable: true // setting to false disables query builder for this chart
  };

  var xScale = d3.scale.ordinal();
  var yScale = d3.scale.linear();
  var labelScale = d3.scale.ordinal();

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('n')
    .offset([-9, 0]);

  var brush = d3.svg.brush()
    .x(xScale)
    .on('brushstart', brushstart)
    .on('brush', brushed)
    .on('brushend', brushend);
    // --- end chart setup ---

  function handleClick(d) {
    if (!options.view || !options.selectable) {
      return;
    }
    var evt = {
      d: d,
      self: this,
      evt: d3.event,
      type: 'click',
      source: 'many'
    };
    options.view.trigger('querybuilder', evt);
  }

  function brushstart(clickedBar) {
    // remove selections and half selections
    var bars = d3.selectAll(options.view.queryAll('rect.selectable'));
    bars.classed('half', false);
    bars.classed('selected', function() {
      return this === clickedBar;
    });
    bars.classed('unselected', function() {
      return this !== clickedBar;
    });
  }

  function brushed() {
    var bars = d3.selectAll(options.view.queryAll('rect.selectable'));
    var numSelected = options.view.queryAll('rect.selectable.selected').length;
    var s = brush.extent();

    bars.classed('selected', function(d) {
      var left = xScale(d.label);
      var right = left + xScale.rangeBand();
      return s[0] <= right && left <= s[1];
    });
    bars.classed('unselected', function(d) {
      var left = xScale(d.label);
      var right = left + xScale.rangeBand();
      return s[0] > right || left > s[1];
    });

    if (!options.view) {
      return;
    }
    if (numSelected !== options.view.queryAll('rect.selectable.selected').length) {
      // number of selected items has changed, trigger querybuilder event
      var evt = {
        type: 'drag',
        source: 'many'
      };
      options.view.trigger('querybuilder', evt);
    }
  }

  function brushend() {
    var bars = d3.selectAll(options.view.queryAll('rect.selectable'));
    if (brush.empty()) {
      bars.classed('selected', false);
      bars.classed('unselected', false);
    }
    d3.select(this).call(brush.clear());

    if (!options.view) {
      return;
    }
    var evt = {
      type: 'drag',
      source: 'many'
    };
    options.view.trigger('querybuilder', evt);
  }

  function handleMouseDown() {
    if (!options.selectable) {
      return;
    }
    var bar = this;
    var parent = $(this).closest('.minichart');
    var background = parent.find('g.brush > rect.background')[0];
    var brushNode = parent.find('g.brush')[0];
    var start = d3.mouse(background)[0];
    var brushstartOnce = _.once(function() {
      brushstart.call(brushNode, bar);
    });

    var w = d3.select(window)
      .on('mousemove', mousemove)
      .on('mouseup', mouseup);

    d3.event.preventDefault(); // disable text dragging

    function mousemove() {
      brushstartOnce();
      var extent = [start, d3.mouse(background)[0]];
      d3.select(brushNode).call(brush.extent(_.sortBy(extent)));
      brushed.call(brushNode);
    }

    function mouseup() {
      // bar.classed('selected', true);
      w.on('mousemove', null).on('mouseup', null);
      if (brush.empty()) {
        // interpret as click
        handleClick.call(bar, d3.select(bar).data()[0]);
      } else {
        brushend.call(brushNode);
      }
    }
  }

  function chart(selection) {
    selection.each(function(data) {
      var values = _.pick(data, 'count');
      var maxValue = d3.max(values);
      var sumValues = d3.sum(values);
      var percentFormat = shared.friendlyPercentFormat(maxValue / sumValues * 100);
      var labels = options.labels;
      var el = d3.select(this);

      xScale
        .domain(_.pick(data, 'label'))
        .rangeBands([0, width], 0.3, 0.0);

      yScale
        .domain([0, maxValue])
        .range([height, 0]);

      // set label defaults
      if (options.labels) {
        _.defaults(labels, {
          'text-anchor': function(d, i) {
            if (i === 0) {
              return 'start';
            }
            if (i === data.length - 1) {
              return 'end';
            }
            return 'middle';
          },
          x: labels['text-anchor'] === 'middle' ? xScale.rangeBand() / 2 : function(d, i) {
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
          text: function(d) {
            return d.count;
          }
        });
      }

      // setup tool tips
      tip.html(function(d, i) {
        if (typeof d.tooltip === 'function') {
          return d.tooltip(d, i);
        }
        return d.tooltip || tooltipTemplate({
          label: shared.truncateTooltip(d.label),
          count: percentFormat(d.count / sumValues * 100, false)
        });
      });
      el.call(tip);

      // draw scale labels and lines if requested
      if (options.scale) {
        var triples = function(v) {
          return [v, v / 2, 0];
        };

        var scaleLabels = _.map(triples(maxValue / sumValues * 100), function(x) {
          return percentFormat(x, true);
        });

        labelScale
          .domain(scaleLabels)
          .rangePoints([0, height]);

        var legend = el.selectAll('g.legend')
          .data(scaleLabels);

        // create new legend elements
        var legendEnter = legend.enter().append('g')
          .attr('class', 'legend');

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
        legend
          .attr('transform', function(d) {
            return 'translate(0, ' + labelScale(d) + ')';
          });

        legend.select('text')
          .text(function(d) {
            return d;
          });

        legend.select('line')
          .attr('x2', width);

        legend.exit().remove();
      }

      if (options.selectable) {
        var gBrush = el.selectAll('.brush').data([0]);
        gBrush.enter().append('g')
          .attr('class', 'brush')
          .call(brush)
          .selectAll('rect')
          .attr('y', 0)
          .attr('height', height);
      }

      // select all g.bar elements
      var bar = el.selectAll('.bar')
        .data(data, function(d) {
          return d.label; // identify data by its label
        });

      // create new bar elements as needed
      var barEnter = bar.enter().append('g')
        .attr('class', 'bar')
        .attr('transform', function(d) {
          return 'translate(' + xScale(d.label) + ', 0)';
        });

      // if background bars are used, fill whole area with background bar color first
      if (options.bgbars) {
        barEnter.append('rect')
          .attr('class', 'bg')
          .attr('width', xScale.rangeBand())
          .attr('height', height);
      }

      // now attach the foreground bars
      barEnter
        .append('rect')
        .attr('class', options.selectable ? 'fg selectable' : 'fg')
        .attr('x', 0)
        .attr('width', xScale.rangeBand());

      // create mouseover and click handlers
      if (options.bgbars) {
        // ... on a separate front "glass" pane if we use background bars
        barEnter.append('rect')
          .attr('class', 'glass')
          .attr('width', xScale.rangeBand())
          .attr('height', height)
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);
      } else {
        // ... or attach tooltips directly to foreground bars if we don't use background bars
        barEnter.selectAll('.fg')
          .on('mouseover', tip.show)
          .on('mouseout', tip.hide);

        if (options.selectable) {
          barEnter.selectAll('.selectable').on('mousedown', handleMouseDown);
        }
      }

      if (options.labels) {
        barEnter.append('text')
          .attr('x', labels.x)
          .attr('dx', labels.dx)
          .attr('y', labels.y)
          .attr('dy', labels.dy)
          .attr('text-anchor', labels['text-anchor']);
      }


      // now update _all_ bar elements (old and new) based on data
      bar.selectAll('.fg')
        .transition()
        .attr('y', function(d) {
          return yScale(d.count);
        })
        .attr('height', function(d) {
          return height - yScale(d.count);
        });

      if (options.labels) {
        bar.select('text').text(labels.text);
      } else {
        bar.select('text').remove();
      }

      // finally remove obsolete bar elements
      bar.exit().remove();
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

module.exports = minicharts_d3fns_many;
