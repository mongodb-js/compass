var View = require('ampersand-view');
var toNS = require('mongodb-ns');
// var debug = require('debug')('scout:sidebar:collection-list-item');

var CollectionListItemView = View.extend({
  bindings: {
    'model._id': {
      hook: 'ns'
    },
    title: {
      type: 'attribute',
      hook: 'ns',
      name: 'title'
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
    },
    title: {
      deps: ['model._id', 'is_special'],
      fn: function() {
        var title = this.model._id;
        if (this.is_special) {
          title += ' (internal collection)';
        }
        return title;
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
