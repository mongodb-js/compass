var View = require('ampersand-view');
var CollectionListItemView = require('./collection-list-item');
var _ = require('lodash');

function fast_show(parent, model) {
  parent.trigger('show', model);
}

/**
 * @todo (imlucas): Keyboard nav: up/down: change active item,
 * right: -> show collection, left: -> hide collection
 */
var CollectionListView = View.extend({
  template: '<ul class="list-group" data-hook="collections"></ul>',
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, CollectionListItemView, this.queryByHook('collections'));
  },
  show: function(model) {
    _.defer(fast_show, this.parent, model);
  }
});

module.exports = CollectionListView;
