var AmpersandView = require('ampersand-view');
var ViewSwitcher = require('ampersand-view-switcher');
var app = require('ampersand-app');
var format = require('util').format;
var SidebarView = require('../sidebar');
var CollectionView = require('./collection');
var debug = require('debug')('scout-ui:home');

module.exports = AmpersandView.extend({
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
        return app.instance.collections.find({
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

    app.statusbar.watch(this, app.instance);

    this.listenTo(app.instance, 'sync', function() {
      if (!this.ns) return;
      if (!this.currentCollection) return;
      this.showCollection(this.currentCollection);
    });

    this.listenToAndRun(app.connection, 'change:name', this.updateTitle);
    this.once('change:rendered', this.onRendered);
    app.instance.fetch();
  },
  updateTitle: function() {
    var model = app.instance.collections.selected;
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
    var collection = app.instance.collections;
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
      prepareView: function(el) {
        var view = new SidebarView({
          el: el,
          parent: this,
          collection: app.instance.collections
        });
        view.on('show', this.showCollection.bind(this));
        return view;
      }
    }
  }
});
