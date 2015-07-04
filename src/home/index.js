var AmpersandView = require('ampersand-view');
var ViewSwitcher = require('ampersand-view-switcher');
var MongoDBInstance = require('../models/mongodb-instance');
var debug = require('debug')('scout-ui:home');
var app = require('ampersand-app');
var format = require('util').format;
var SidebarView = require('../sidebar');
var CollectionView = require('./collection');

module.exports = AmpersandView.extend({
  children: {
    model: MongoDBInstance
  },
  props: {
    switcher: {
      type: 'object',
      default: null
    },
    ns: {
      type: 'string',
      allowNull: true,
      default: null
    }
  },
  derived: {
    currentCollection: {
      deps: ['ns'],
      fn: function() {
        if (!this.ns) return null;
        return this.model.collections.find({
          _id: this.ns
        });
      }
    },
    currentCollectionView: {
      cache: false,
      fn: function() {
        return this.switcher ?
          this.switcher.current : null;
      }
    }
  },
  initialize: function(options) {
    options = options || {};
    this.ns = options.ns;

    app.statusbar.watch(this, this.model);

    this.listenTo(this.model, 'sync', function() {
      if (!this.ns) return;
      if (!this.currentCollection) return;
      this.showCollection(this.currentCollection);
    });

    this.listenToAndRun(app.connection, 'change:name', this.updateTitle);
    this.once('change:rendered', this.onRendered);
    this.model.fetch();
  },
  updateTitle: function() {
    var model = this.model.collections.selected;
    var title = app.connection.uri;
    if (model) {
      title += '/' + model.getId();
    }
    title += ' (' + app.connection.name + ')';
    document.title = title;
  },
  onRendered: function() {
    this.switcher = new ViewSwitcher(this.queryByHook('collection-container'), {
      show: function() {}
    });
  },
  showCollection: function(model) {
    var collection = this.model.collections;
    if (!collection.select(model)) {
      return debug('already selected %s', model);
    }

    this.switcher.set(new CollectionView({
      model: model
    }));

    app.navigate(format('schema/%s', model.getId()), {
      silent: true
    });

    this.updateTitle();
  },
  template: require('./index.jade'),
  subviews: {
    sidebar: {
      hook: 'sidebar',
      waitFor: 'model.collections',
      prepareView: function(el) {
        var view = new SidebarView({
          el: el,
          parent: this,
          collection: this.model.collections
        });
        view.on('show', this.showCollection.bind(this));
        return view;
      }
    }
  }
});
