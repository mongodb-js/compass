import Collection from 'ampersand-rest-collection';
import Connection from './connection';
import storageMixin from 'storage-mixin';
import forEach from 'lodash.foreach';
import selectableMixin from './selectable-collection-mixin';
import electron from 'electron';
const electronApp = electron.remote.app;

export default Collection.extend(selectableMixin, storageMixin, {
  model: Connection,
  namespace: 'Connections',
  storage: {
    backend: 'splice',
    appName: electronApp.getName()
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
    const recentConnections = this.filter(function(model) {
      return !model.is_favorite;
    });
    if (recentConnections.length > this.maxLength) {
      // if there is no space anymore, remove the oldest recent connection first.
      const toRemove = this.remove(recentConnections.slice(0, recentConnections.length - this.maxLength));
      forEach(toRemove, function(model) {
        model.destroy();
      });
    }
  },
  add: function(models, options) {
    Collection.prototype.add.call(this, models, options);
    this._prune();
  }
  // activeChanged: function(changedModel) {
  //   if (changedModel.active) {
  //     this.each(function(model) {
  //       if (model !== changedModel) {
  //         model.active = false;
  //       }
  //     });
  //     this.trigger('activate', changedModel);
  //   }
  // },
  // deactivateAll: function() {
  //   this.each(function(model) {
  //     model.active = false;
  //   });
  // },
  // pinnedChanged: function(changedModel) {
  //   if (!changedModel.is_favorite) {
  //     this._prune();
  //   }
  // },
  // listenToModel: function(model) {
  //   this.listenTo(model, 'change:active', this.activeChanged.bind(this));
  //   this.listenTo(model, 'change:is_favorite', this.pinnedChanged.bind(this));
  //   if (model.active) {
  //     this.activeChanged(model);
  //   }
  // },
  // initialize: function() {
  //   this.on('add', this.listenToModel);
  //   this.on('reset', function(collection) {
  //     collection.each(function(model) {
  //       collection.listenToModel.call(collection, model);
  //     });
  //   });
  //   this.reset();
  // }

});
