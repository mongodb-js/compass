var d3 = require('d3');
var _ = require('lodash');
var $ = require('jquery');
var tooltipHtml = require('./tooltip.jade');
var shared = require('./shared');
// var debug = require('debug')('scout:minicharts:few');

require('../d3-tip')(d3);

var minicharts_d3fns_few = function() {
  // --- beginning chart setup ---
  var width = 400;
  var height = 100;
  var barHeight = 25;
  var options = {
    view: null
  };

  var xScale = d3.scale.linear();

  var brush = d3.svg.brush()
    .x(xScale)
    .on('brush', brushed)
    .on('brushend', brushend);

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('n')
    .offset([-9, 0]);
  // --- end chart setup ---

  function handleClick(d) {
    if (!options.view) return;
    var fgRect = $(this).siblings('rect.fg')[0];
    var evt = {
      d: d,
      self: fgRect,
      all: options.view.queryAll('rect.fg'),
      evt: d3.event,
      type: 'click',
      source: 'few'
    };
    options.view.trigger('querybuilder', evt);
  }

  function brushed() {
    var bars = d3.selectAll(options.view.queryAll('rect.fg'));
    var s = brush.extent();

    bars.classed('selected', function(d) {
      var left = xScale(d.xpos);
      var right = left + xScale(d.count);
      return s[0] <= right && left <= s[1];
    });
    bars.classed('unselected', function(d) {
      var left = xScale(d.xpos);
      var right = left + xScale(d.count);
      return s[0] > right || left > s[1];
    });
  }

  function brushend() {
    var bars = d3.selectAll(options.view.queryAll('rect.fg'));
    if (brush.empty()) {
      bars.classed('selected', false);
      bars.classed('unselected', false);
    }
    d3.select(this).call(brush.clear());

    if (!options.view) return;
    var evt = {
      selected: options.view.queryAll('rect.fg.selected'),
      type: 'drag',
      source: 'many'
    };
    options.view.trigger('querybuilder', evt);
  }

  function handleMouseDown() {
    var bar = this;
    var parent = $(this).closest('.minichart');
    var background = parent.find('g.brush > rect.background')[0];
    var brushNode = parent.find('g.brush')[0];
    var start = d3.mouse(background)[0];

    var w = d3.select(window)
      .on('mousemove', mousemove)
      .on('mouseup', mouseup);

    d3.event.preventDefault(); // disable text dragging

    function mousemove() {
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
      var values = _.pluck(data, 'count');
      var sumValues = d3.sum(values);
      var maxValue = d3.max(values);
      var percentFormat = shared.friendlyPercentFormat(maxValue / sumValues * 100);
      var el = d3.select(this);

      xScale
        .domain([0, sumValues])
        .range([0, width]);

      // setup tool tips
      tip.html(function(d, i) {
        if (typeof d.tooltip === 'function') {
          return d.tooltip(d, i);
        }
        return d.tooltip || tooltipHtml({
            label: shared.truncateTooltip(d.label),
            count: percentFormat(d.count / sumValues * 100, false)
          });
      });
      el.call(tip);

      var gBrush = el.selectAll('.brush').data([0]);
      gBrush.enter().append('g')
        .attr('class', 'brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', 0)
        .attr('height', height);

      // select all g.bar elements
      var bar = el.selectAll('g.bar')
        .data(data, function(d) {
          return d.label; // identify data by its label
        });

      bar
        .transition() // only apply transition to already existing bars
        .attr('transform', function(d) {
          return 'translate(' + xScale(d.xpos) + ', ' + (height - barHeight) / 2 + ')';
        });

      var barEnter = bar.enter().append('g')
        .attr('class', 'bar few')
        .attr('transform', function(d, i) { // repeat transform attr here but without transition
          var xpos = _.sum(_(data)
            .slice(0, i)
            .pluck('count')
            .value()
          );
          d.xpos = xpos;
          return 'translate(' + xScale(xpos) + ', ' + (height - barHeight) / 2 + ')';
        });


      barEnter.append('rect')
        .attr('class', function(d, i) {
          return 'fg fg-' + i;
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
        .on('mouseout', tip.hide)
        .on('mousedown', handleMouseDown);

      bar.select('rect.fg')
        .transition()
        .attr('width', function(d) {
          return xScale(d.count);
        });

      bar.select('rect.glass')
        .transition()
        .attr('width', function(d) {
          return xScale(d.count);
        });

      bar.select('text')
        .text(function(d) {
          return d.label;
        });

      bar.exit().remove();
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

module.exports = minicharts_d3fns_few;
