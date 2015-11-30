var Collection = require('ampersand-rest-collection');
var Connection = require('./connection');
var storageMixin = require('storage-mixin');
var _ = require('lodash');

module.exports = Collection.extend(storageMixin, {
  model: Connection,
  namespace: 'Connections',
  storage: 'splice',
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
    var usedConnections = this.filter(function(model) {
      return model.last_used !== null;
    });
    if (usedConnections.length > this.maxLength) {
      var usedNonFavorites = _.sortBy(this.filter(function(model) {
        return model.last_used !== null && !model.is_favorite;
      }), 'last_used');
      // if there is no space anymore, remove the oldest non-favorite event first
      var toRemove = this.remove(usedNonFavorites.slice(0, usedConnections.length - this.maxLength));
      _.map(toRemove, function(model) {
        model.destroy();
      });
    }
  },
  add: function(models, options) {
    Collection.prototype.add.call(this, models, options);
    this._prune();
  },
  activeChanged: function(changedModel) {
    if (changedModel.active) {
      this.each(function(model) {
        if (model !== changedModel) {
          model.active = false;
        }
      });
      this.trigger('activate', changedModel);
    }
  },
  deactivateAll: function() {
    this.each(function(model) {
      model.active = false;
    });
  },
  pinnedChanged: function(changedModel) {
    if (!changedModel.is_favorite) {
      this._prune();
    }
  },
  listenToModel: function(model) {
    this.listenTo(model, 'change:active', this.activeChanged.bind(this));
    this.listenTo(model, 'change:is_favorite', this.pinnedChanged.bind(this));
    if (model.active) {
      this.activeChanged(model);
    }
  },
  initialize: function() {
    this.on('add', this.listenToModel);
    this.on('reset', function(collection) {
      collection.each(function(model) {
        collection.listenToModel.call(collection, model);
      });
    });
    this.reset();
  }

});
