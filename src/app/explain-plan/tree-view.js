var $ = require('jquery');
var View = require('ampersand-view');
var StageView = require('./stage-view');
var StageCollection = require('./stage-model').Collection;
var _ = require('lodash');
var d3 = window.d3 = require('d3');

// this plugin allows for tree layout of variable-sized nodes
require('d3-flextree');

var debug = require('debug')('mongodb-compass:explain:tree');

var DEFAULT_CARD_WIDTH = 276;        // width of a card
var DEFAULT_CARD_HEIGHT = 132;       // height of a card without highlighted fields
var SHARD_CARD_HEIGHT = 57;          // height of a shard label card
var HIGHLIGHT_FIELD_HEIGHT = 41;     // height of a single "heighlighted" field
var VERTICAL_PADDING = 50;           // vertical space between two cards

module.exports = View.extend({
  template: require('./tree-view.jade'),
  props: {
    height: 'number' // height of the .tree-container div
  },
  bindings: {
    height: {
      type: function(el, value) {
        $(el).css('height', value);
      }
    }
  },
  initialize: function() {
  },
  render: function() {
    this.renderWithTemplate(this);
    this.drawd3();
  },
  drawd3: function() {
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
    var nodes = tree.nodes(this.model.serialize({derived: true}));
    var links = tree.links(nodes);

    // @todo: UNHACK ME
    nodes.forEach(function(d) { d.x += 500; });

    var leafNode = _.max(nodes, 'depth');
    this.height = leafNode.y + leafNode.y_size;
    this.collection = new StageCollection(nodes, {parse: false});

    // if we want curved links between the nodes, use `diagonal` instead of `elbow`
    // var diagonal = d3.svg.diagonal()
    //   .projection(function(d) { return [d.x + DEFAULT_CARD_WIDTH / 2, d.y]; });

    // right angle links between nodes
    var elbow = function(d) {
      return 'M' + (d.source.x + d.source.x_size / 2) + ',' + d.source.y +
        'V' + (d.target.y - VERTICAL_PADDING / 2) +
        'H' + (d.target.x + DEFAULT_CARD_WIDTH / 2) +
        'V' + d.target.y;
    };

    // links are svg elements
    var svg = d3.select(this.el).append('svg')
      .attr('width', 1000)
      .attr('height', this.height);

    var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.target.id; });

    link.enter().insert('path', 'g')
      .attr('class', 'link')
      .attr('d', elbow);

    // the cards themselves are divs rendered as AmpersandViews
    this.renderCollection(this.collection, StageView, '[data-hook=stages-container]');
  }
});
