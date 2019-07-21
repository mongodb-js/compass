const Collection = require('ampersand-rest-collection');
const storageMixin = require('storage-mixin');
const electronApp = require('electron').remote.app;
const Connection = require('./connection');

const ConnectionCollection = Collection.extend(storageMixin, {
  model: Connection,
  namespace: 'Connections',
  storage: { backend: 'splice', appname: electronApp.getName() },
  comparator: (a, b) => {
    if (a.isFavorite === b.isFavorite) {
      return a.lastUsed - b.lastUsed;
    }

    return a.isFavorite ? -1 : 1;
  },
  mainIndex: '_id',
  indexes: ['name'],
  maxLength: 10,
  _prune() {
    const recentConnections = this.filter((model) => !model.isFavorite);

    if (recentConnections.length > this.maxLength) {
      // if there is no space anymore, remove the oldest recent connection first.
      const toRemove = this.remove(recentConnections.slice(0, recentConnections.length - this.maxLength));

      each(toRemove, (model) => model.destroy());
    }
  },
  add(models, options) {
    Collection.prototype.add.call(this, models, options);
    this._prune();
  },
  select(model) {
    if (model.selected) {
      return false;
    }

    raf(function selectableMarkModelSelected() {
      const current = this.selected;

      if (current) {
        current.selected = false;
      }

      model.selected = true;
      this.selected = model;
      this.trigger('change:selected', this.selected);
    }.bind(this));

    return true;
  },
  unselectAll() {
    if (this.selected) {
      this.selected.set({ selected: false });
    }

    this.selected = null;
    this.trigger('change:selected', this.selected);
  }
});

module.exports = ConnectionCollection;
