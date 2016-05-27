var $ = require('jquery');
var View = require('ampersand-view');
var StageView = require('./stage-view');
var StageCollection = require('./stage-model').Collection;
var _ = require('lodash');
var format = require('util').format;
var d3 = window.d3 = require('d3');

// this plugin allows for tree layout of variable-sized nodes
require('d3-flextree');

var debug = require('debug')('mongodb-compass:explain:tree');

var DEFAULT_CARD_WIDTH = 276;        // width of a card
var DEFAULT_CARD_HEIGHT = 132;       // height of a card without highlighted fields
var SHARD_CARD_HEIGHT = 57;          // height of a shard label card
var HIGHLIGHT_FIELD_HEIGHT = 41;     // height of a single 'heighlighted' field
var VERTICAL_PADDING = 50;           // vertical space between two cards

module.exports = View.extend({
  template: require('./tree-view.jade'),
  props: {
    height: 'number', // height of the tree
    width: 'number'   // width of the tree
  },
  bindings: {
    height: {
      type: function(el, value) {
        $(el).css('height', value);
      }
    }
  },
  collections: {
    stages: StageCollection
  },
  initialize: function() {
  },
  render: function() {
    this.renderWithTemplate(this);
    // the cards themselves are divs rendered as AmpersandViews
    this.renderCollection(this.stages, StageView, '[data-hook=stages-container]');
    this.drawd3();
  },
  drawd3: function() {
    var view = this;
    var tree = d3.layout.flextree()
      .setNodeSizes(true)
      .nodeSize(function(d) {
        var height = d.isShard ? SHARD_CARD_HEIGHT : DEFAULT_CARD_HEIGHT +
          (d.highlightPairs.length * HIGHLIGHT_FIELD_HEIGHT);
        height += VERTICAL_PADDING;
        return [DEFAULT_CARD_WIDTH, height];
      })
      .spacing(function separation(a, b) {
        return a.parent === b.parent ? 20 : 50;
      });

    var nodes = tree.nodes(view.model.serialize({derived: true}));
    var links = tree.links(nodes);

    // compute some boundaries
    var leafNode = _.max(nodes, 'depth');
    var rightMostNode = _.max(nodes, 'x');
    var leftMostNode = _.min(nodes, 'x');
    var xDelta = leftMostNode.x;
    view.height = leafNode.y + leafNode.y_size;
    view.width = rightMostNode.x + rightMostNode.x_size - leftMostNode.x;

    nodes.forEach(function(d, i) {
      // align left most node to the left edge
      d.x += -xDelta;
      // set the id here, so that already existing stage models can be merged
      d.id = format('stage-%d', i);
    });

    // merge new with existing stages, renderCollection will automatically
    // draw new ones and remove old ones, similar to d3 data bindings.
    view.stages.set(nodes);

    // right angle links between nodes
    var elbow = function(d) {
      return 'M' + (d.source.x + d.source.x_size / 2) + ',' + d.source.y +
        'V' + (d.target.y - VERTICAL_PADDING / 2) +
        'H' + (d.target.x + DEFAULT_CARD_WIDTH / 2) +
        'V' + d.target.y;
    };

    // cards and drag behavior (via d3.behavior.zoom)
    var svg = d3.select(view.el).selectAll('svg.links').data([null]);
    var container;
    var zoom = d3.behavior.zoom()
      .scaleExtent([1, 1])
      .on('zoom', function() {
        var tx = d3.event.translate[0];
        tx = Math.min(0, Math.max(tx, -(view.width - DEFAULT_CARD_WIDTH)));
        zoom.translate([tx, 0]);
        container.attr('transform', 'translate(' + tx + ')');
        nodes.forEach(function(d) {
          d.xoffset = tx;
        });
        view.stages.set(nodes);
      });

    container = svg.enter().append('svg')
      .attr('class', 'links')
      .attr('width', '100%')
      .attr('height', view.height)
      .call(zoom)
    .append('g');

    // remove unneeded event handlers
    svg.on('dblclick.zoom', null)
      .on('touchstart.zoom', null)
      .on('wheel.zoom', null)
      .on('mousewheel.zoom', null)
      .on('MozMousePixelScroll.zoom', null);

    // links are svg elements
    var link = container.selectAll('path.link')
      .data(links, function(d) { return d.target.id; });

    link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('d', elbow);

    link.exit().remove();
  }
});
