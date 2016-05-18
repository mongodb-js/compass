var $ = require('jquery');
var View = require('ampersand-view');
var StageView = require('./stage-view');
var StageCollection = require('./stage-model').Collection;
var _ = require('lodash');
var d3 = window.d3 = require('d3');

require('d3-flextree');

var debug = require('debug')('mongodb-compass:explain:tree');

var HIGHLIGHT_FIELD_HEIGHT = 41;
var DEFAULT_CARD_WIDTH = 276;
var DEFAULT_CARD_HEIGHT = 132;
var VERTICAL_PADDING = 50;

module.exports = View.extend({
  template: require('./tree-view.jade'),
  props: {
    height: 'number'
  },
  bindings: {
    height: {
      type: function(el, value) {
        $(el).css('height', value);
      }
    }
  },
  initialize: function() {
    var tree = d3.layout.flextree()
      .setNodeSizes(true)
      .nodeSize(function(d) {
        var height = DEFAULT_CARD_HEIGHT + VERTICAL_PADDING
          + (d.highlightPairs.length * HIGHLIGHT_FIELD_HEIGHT);
        return [DEFAULT_CARD_WIDTH, height];
      })
      .spacing(function separation(a, b) {
        return a.parent === b.parent ? 20 : 50;
      });
    var nodes = tree.nodes(this.model.serialize({derived: true}));
    debug('nodes', nodes);

    // @todo: UNHACK ME
    nodes.forEach(function(d) { d.x += 500; });

    var leafNode = _.max(nodes, 'depth');
    this.height = leafNode.y + leafNode.y_size;
    this.collection = new StageCollection(nodes, {parse: false});
  },
  render: function() {
    this.renderWithTemplate(this);
    this.renderCollection(this.collection, StageView, '[data-hook=stages-container]');
  }
});
