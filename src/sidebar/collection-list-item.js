var View = require('ampersand-view');
var CollectionListItemView = View.extend({
  bindings: {
    'model._id': {
      hook: 'ns'
    },
    'model.selected': {
      type: 'booleanClass',
      name: 'active'
    }
  },
  events: {
    click: '_onClick'
  },
  template: require('./collection-list-item.jade'),
  _onClick: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.parent.show(this.model);
  }
});

module.exports = CollectionListItemView;
