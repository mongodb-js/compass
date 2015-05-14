var d3 = require('d3');
var _ = require('lodash');
var debug = require('debug')('scout-ui:minichart-category');

require('d3-tip')(d3);


/**
 * helper function to move an element to the front
 */
d3.selection.prototype.moveToFront = function() {
  return this.each(function() {
    this.parentNode.appendChild(this);
  });
};

module.exports = function(opts) {
  var values = opts.data;

  var margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  };

  var width = opts.width - margin.left - margin.right;
  var height = opts.height - margin.top - margin.bottom;
  var el = opts.el;

  // group into categories and count the values per bucket, sort descending
  var categories = _(values)
    .groupBy(function(d) {
      return d;
    })
    .map(function(v, k) {
      return {
        category: k,
        count: v.length
      };
    })
    .sortByOrder('count', [false]) // descending on count
    .value();

  var categoryLabels = _.pluck(categories, 'category');

  var x = d3.scale.ordinal()
    .domain(categoryLabels)
    .rangeBands([0, width], 0.3, 0.0);

  var y = d3.scale.linear()
    .domain([0, d3.max(_.pluck(categories, 'count'))])
    .range([height, 0]);

  // set up tooltips
  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .html(function(d) {
      return d.category;
    })
    .direction('n')
    .offset([-9, 0]);

  // clear element first
  d3.select(el).selectAll('*').remove();

  var svg = d3.select(el)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .call(tip);

  var bar = svg.selectAll('.bar')
    .data(categories)
    .enter().append('g')
    .attr('class', 'bar')
    .attr('transform', function(d) {
      return 'translate(' + x(d.category) + ', 0)';
    });

  bar.append('rect')
    .attr('class', 'bg')
    .attr('width', x.rangeBand())
    .attr('height', height);

  bar.append('rect')
    .attr('class', 'fg')
    .attr('x', 0)
    .attr('y', function(d) {
      return y(d.count);
    })
    .attr('width', x.rangeBand())
    .attr('height', function(d) {
      return height - y(d.count);
    })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide);

  // bar.append('text')
  //   .attr('dy', '.75em')
  //   .attr('y', height + 5)
  //   .attr('x', x.rangeBand() / 2)
  //   .attr('text-anchor', 'middle')
  //   .text(function(d) {
  //     return d.category;
  //   });
};

