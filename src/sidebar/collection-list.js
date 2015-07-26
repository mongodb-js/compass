var View = require('ampersand-view');
var CollectionListItemView = require('./collection-list-item');
var raf = require('raf');

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
    var parent = this.parent;
    raf(function() {
      parent.trigger('show', model);
    });
  }
});

module.exports = CollectionListView;
