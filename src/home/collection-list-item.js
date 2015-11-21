var ListItemView = require('../sidebar/list-item');
var toNS = require('mongodb-ns');
var _ = require('lodash');
// var debug = require('debug')('scout:sidebar:collection-list-item');

var CollectionListItemView = ListItemView.extend({
  props: {
    displayProp: ['string', true, 'name']
  },
  bindings: _.extend({}, ListItemView.prototype.bindings, {
    is_special: {
      type: 'booleanClass',
      name: 'special'
    }
  }),
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
  }
});

module.exports = CollectionListItemView;
