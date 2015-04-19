var AmpersandView = require('ampersand-view');
var AmpersandModel = require('ampersand-model');
var AmpersandState = require('ampersand-state');
var client = require('../../../scout-client')();
var _ = require('underscore');
var $ = require('jquery');
var flatnest = require('flatnest');

var AmpersandCollection = require('ampersand-collection');
var RestMixin = require('ampersand-collection-rest-mixin');

var Document = AmpersandState.extend({
  extraProperties: 'allow'
});

var Documents = AmpersandCollection.extend({
  model: Document,
  fetch: function(options) {
    options = options ? _.clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }
    var model = this;
    var success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) return false;
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);

    client.sample(this.ns, {}, function(err, d) {
      if (err) return options.error({}, 'error', err.message);
      options.success(d, 'success', d);
    });
  },
});

var CollectionIndex = AmpersandState.extend({
  extraProperties: 'allow'
});

var CollectionIndexes = AmpersandCollection.extend({
  model: CollectionIndex
});

var CollectionStats = AmpersandState.extend({
  props: {
    index_sizes: 'number',
    document_count: 'number',
    document_size: 'number',
    storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
    padding_factor: 'number',
    extent_count: 'number',
    extent_last_size: 'number',
    flags_user: 'number',
    flags_system: 'number'
  }
});

var Collection = AmpersandModel.extend({
  props: {
    _id: 'string'
  },
  extraProperties: 'allow',
  children: {
    stats: CollectionStats
  },
  collections: {
    indexes: CollectionIndexes,
    documents: Documents
  }
});

var Collections = AmpersandCollection.extend(RestMixin, {
  model: Collection
});

var Database = AmpersandModel.extend({

});
var Databases = AmpersandCollection.extend({
  model: Database
});

var InstanceHostInfo = AmpersandState.extend({
  extraProperties: 'allow'
});
var InstanceBuildInfo = AmpersandState.extend({
  extraProperties: 'allow'
});


// Wrap an optional error callback with a fallback error event.
var wrapError = function(model, options) {
  var error = options.error;
  options.error = function(resp) {
    if (error) error(model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

var Instance = AmpersandModel.extend({
  props: {
    _id: {
      type: 'string',
      required: true
    },
    name: {
      type: 'string'
    }
  },
  children: {
    databases: Databases,
    collections: Collections,
    host: InstanceHostInfo,
    build: InstanceBuildInfo
  },
  fetch: function(options) {
    options = options ? _.clone(options) : {};
    if (!options.parse) {
      options.parse = true;
    }
    var model = this;
    var success = options.success;
    options.success = function(resp) {
      if (!model.set(model.parse(resp, options), options)) return false;
      if (success) success(model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);

    client.instance(function(err, d) {
      if (err) return options.error({}, 'error', err.message);
      options.success(d, 'success', d);
    });
  },
  parse: function(d) {
    setTimeout(function() {
      this.databases.reset(d.databases);
      this.collections.reset(_.flatten(d.collections));

      console.log('Instance has collections:', this.collections.toJSON());
      console.log('Instance has databases:', this.databases.toJSON());
    }.bind(this), 100);
    return d;
  }
});

var ViewSwitcher = require('ampersand-view-switcher');


var CollectionView = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    }
  },
  template: '<div><h1 data-hook="name"></h1><code data-hook="sample"></code></div>',
  render: function() {
    this.renderWithTemplate();
    this.listenTo(this.model.documents, 'sync reset', function() {
      $(this.el).find('[data-hook=sample]').html(JSON.stringify(this.model.documents.toJSON().map(function(d) {
        return flatnest.flatten(d);
      }), null, 2).replace(/\n/g, '<br />'));
    });
  }
});

var CollectionsListItem = AmpersandView.extend({
  bindings: {
    'model._id': {
      hook: 'name'
    }
  },
  events: {
    'click': '_onClick'
  },
  template: require('./collection-list-item.jade'),
  _onClick: function() {
    this.parent._showCollection(this.model);
  }
});

var CollectionsList = AmpersandView.extend({
  template: '<ul class="list-group" data-hook="collections-list"></ul>',
  render: function() {
    this.renderWithTemplate();
    this.renderCollection(this.collection, CollectionsListItem, this.queryByHook('collections-list'));
  },
  _showCollection: function(model) {
    model.documents.ns = model._id;

    this.parent.switcher.set(new CollectionView({
      model: model
    }));
    model.documents.fetch();
  }
});

module.exports = AmpersandView.extend({
  children: {
    model: Instance
  },
  initialize: function() {
    this.listenTo(this.model, 'sync', this._onModel);
    this.model.fetch();

    this.listenTo(this, 'change:rendered', function() {
      this.switcher = new ViewSwitcher(this.queryByHook('collection-container'), {
        show: function() {}
      });
    }.bind(this));
  },
  template: require('./index.jade'),
  subviews: {
    collections: {
      hook: 'collections',
      prepareView: function(el) {
        return new CollectionsList({
          el: el,
          parent: this,
          collection: this.model.collections
        });
      }
    }
  }
});
