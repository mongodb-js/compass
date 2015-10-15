var View = require('ampersand-view');
var toNS = require('mongodb-ns');
// var debug = require('debug')('scout:sidebar:collection-list-item');

var CollectionListItemView = View.extend({
  bindings: {
    'model._id': {
      hook: 'ns'
    },
    'model.selected': {
      type: 'booleanClass',
      name: 'active'
    },
    is_special: {
      type: 'booleanClass',
      name: 'special'
    }
  },
  events: {
    click: '_onClick'
  },
  derived: {
    is_special: {
      deps: ['model._id'],
      fn: function() {
        if (!this.model._id) {
          return false;
        }
        return toNS(this.model._id).specialish;
      }
    }
  },
  template: require('./collection-list-item.jade'),
  _onClick: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.parent.show(this.model);
  }
});

module.exports = CollectionListItemView;
