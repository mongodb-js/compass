var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var Connection = require('./connection');
var connectionSync = require('./connection-sync')();
var _ = require('lodash');
var restMixin = require('ampersand-collection-rest-mixin');

module.exports = Collection.extend(lodashMixin, restMixin, {
  namespace: 'ConnectionCollection',
  model: Connection,
  comparator: function(a, b) {
    if (a.is_favorite === b.is_favorite) {
      return a.last_used - b.last_used;
    }
    return a.is_favorite ? -1 : 1;
  },
  mainIndex: '_id',
  sync: connectionSync,
  indexes: ['name'],
  maxLength: 3,
  _prune: function() {
    var nonFavorites = this.filter(function(model) {
      return !model.is_favorite;
    });
    if (nonFavorites.length > this.maxLength) {
      // if there is no space anymore, remove the oldest non-favorite event first
      var oldestItems = _.sortBy(nonFavorites, 'last_used');
      var toRemove = this.remove(oldestItems.slice(0, nonFavorites.length - this.maxLength));
      _.map(toRemove, function(model) {
        model.remove();
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
