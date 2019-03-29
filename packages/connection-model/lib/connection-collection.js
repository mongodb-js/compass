const Collection = require('ampersand-rest-collection');
const Connection = require('./extended-model');
const storageMixin = require('storage-mixin');
const each = require('lodash.foreach');
const raf = require('raf');

let appName;

try {
  const electron = require('electron');
  appName = electron.remote ? electron.remote.app : undefined;
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load electron', e.message);
}

module.exports = Collection.extend(storageMixin, {
  model: Connection,
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appName: appName
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
