var Collection = require('ampersand-rest-collection');
var Connection = require('./extended-connection');
var storageMixin = require('storage-mixin');
var each = require('lodash.foreach');
var electron = require('electron');
var electronApp = electron.remote ? electron.remote.app : undefined;
var raf = require('raf');

module.exports = Collection.extend(storageMixin, {
  model: Connection,
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appName: electronApp ? electronApp.getName() : undefined
  },
  comparator: function(a, b) {
    if (a.is_favorite === b.is_favorite) {
      return a.last_used - b.last_used;
    }
    return a.is_favorite ? -1 : 1;
  },
  mainIndex: '_id',
  indexes: ['name'],
  maxLength: 10,
  _prune: function() {
    var recentConnections = this.filter(function(model) {
      return !model.is_favorite;
    });
    if (recentConnections.length > this.maxLength) {
      // if there is no space anymore, remove the oldest recent connection first.
      var toRemove = this.remove(recentConnections.slice(0, recentConnections.length - this.maxLength));
      each(toRemove, function(model) {
        model.destroy();
      });
    }
  },
  add: function(models, options) {
    Collection.prototype.add.call(this, models, options);
    this._prune();
  },
  select: function(model) {
    if (model.selected) {
      return false;
    }
    raf(function selectableMarkModelSelected() {
      var current = this.selected;
      if (current) {
        current.selected = false;
      }
      model.selected = true;
      this.selected = model;
      this.trigger('change:selected', this.selected);
    }.bind(this));

    return true;
  },
  unselectAll: function() {
    if (this.selected) {
      this.selected.set({
        selected: false
      });
    }
    this.selected = null;
    this.trigger('change:selected', this.selected);
  }
});
