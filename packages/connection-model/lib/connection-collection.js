const Collection = require('ampersand-rest-collection');
const Connection = require('./extended-model');
const storageMixin = require('storage-mixin');
const { each } = require('lodash');
const raf = require('raf');

/**
 * The name of a remote electron application that
 * uses `connection-model` as a dependency.
 */
let appName;
let basepath;

try {
  const electron = require('electron');

  appName = electron.remote ? electron.remote.app.getName() : undefined;
  basepath = electron.remote
    ? electron.remote.app.getPath('userData')
    : undefined;
} catch (e) {
  /* eslint no-console: 0 */
  console.log('Could not load electron', e.message);
}

module.exports = Collection.extend(storageMixin, {
  model: Connection,
  namespace: 'Connections',
  storage: {
    backend: 'splice-disk-ipc',
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
