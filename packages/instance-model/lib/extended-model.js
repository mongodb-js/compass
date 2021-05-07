var MongoDBInstance = require('./model');
var MongoDBCollection = require('mongodb-collection-model');
var MongoDBCollectionCollection = require('mongodb-collection-model').Collection;
var BaseDatabaseModel = require('mongodb-database-model');
var BaseDatabaseCollection = require('mongodb-database-model').Collection;
var filterableMixin = require('ampersand-collection-filterable');
var toNS = require('mongodb-ns');
var raf = require('raf');
var result = require('lodash.result');
var clone = require('lodash.clone');

/**
 * A user selectable collection of `MongoDBCollection`'s with `specialish`
 * collections filtered out.
 */
var MongoDBCollectionOnInstanceCollection = MongoDBCollectionCollection.extend({
  namespace: 'MongoDBCollectionOnInstanceCollection',
  model: MongoDBCollection,
  parse: function(res) {
    return res.filter(function(d) {
      return !toNS(d._id).system;
    });
  },
  /**
   * @param {Object} model you want to mark as selected.
   * @return {Boolean} false if model already selected, true if incoming
   * selected and previously selected toggled to true.
   */
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
}, filterableMixin);

var DatabaseModel = BaseDatabaseModel.extend({
  collections: {
    collections: MongoDBCollectionOnInstanceCollection
  }
});

var DatabaseCollection = BaseDatabaseCollection.extend({
  model: DatabaseModel
}, filterableMixin);

/**
 * Metadata for a MongoDB Instance, such as a `db.hostInfo()`, `db.listDatabases()`,
 * `db.buildInfo()`, and more.
 *
 * @see http://npm.im/mongodb-instance-model
 */
module.exports = MongoDBInstance.extend({
  namespace: 'MongoDBInstance',
  collections: {
    databases: DatabaseCollection,
    collections: MongoDBCollectionOnInstanceCollection
  },
  url: '/instance',
  fetch: function(options) {
    var model = this;
    var url = result(model, 'url');

    options = options ? clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }

    var success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) {
        return false;
      }
      if (success) {
        success(model, resp, options);
      }
      model.trigger('sync', model, resp, options);
    };

    var fn = options.error;
    options.error = function(resp) {
      if (fn) {
        fn(model, resp, options);
      }
      model.trigger('error', model, resp, options);
    };

    var done = function(err, res) {
      if (err) {
        return options.error({}, 'error', err.message);
      }
      raf(function onClientSuccess() {
        options.success(res, 'success', res);
      });
    };

    options.dataService.instance({}, done);
  }
});
