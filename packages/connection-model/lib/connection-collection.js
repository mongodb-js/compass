const Collection = require('ampersand-rest-collection');
const Connection = require('./extended-model');
const storageMixin = require('storage-mixin');
const { each } = require('lodash');
const raf = require('raf');
const { getStoragePaths } = require('@mongodb-js/compass-utils');
const { appName, basepath } = getStoragePaths() || {};

module.exports = Collection.extend(storageMixin, {
  model: Connection,
  namespace: 'Connections',
  storage: {
    backend:
      process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE === 'true'
        ? 'disk'
        : 'splice-disk-ipc',
    appName,
    basepath
  },
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
      const toRemove = this.remove(
        recentConnections.slice(0, recentConnections.length - this.maxLength)
      );

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

    const selectableMarkModelSelected = () => {
      const current = this.selected;

      if (current) {
        current.selected = false;
      }

      model.selected = true;
      this.selected = model;
      this.trigger('change:selected', this.selected);
    };

    raf(selectableMarkModelSelected.bind(this));

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
