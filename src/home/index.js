var View = require('ampersand-view');
var ViewSwitcher = require('ampersand-view-switcher');
var app = require('ampersand-app');
var format = require('util').format;
var SidebarView = require('../sidebar');
var CollectionView = require('./collection');
var debug = require('debug')('scout-ui:home');
var raf = require('raf');

var HomeView = View.extend({
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
  initialize: function(options) {
    options = options || {};
    this.ns = options.ns;

    app.statusbar.watch(this, app.instance);

    this.listenTo(app.instance, 'sync', function() {
      if (!this.ns) {
        app.instance.collections.unselectAll();
      } else {
        this.showCollection(app.instance.collections.get(this.ns));
      }
    }.bind(this));

    this.listenTo(app.connection, 'change:name', this.updateTitle);
    this.once('change:rendered', this.onRendered);

    this.fetch(app.instance);
  },
  updateTitle: function(model) {
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
    app.queryOptions.reset();
    var view = new CollectionView({
      model: model
    });
    this.switcher.set(view);
    this.updateTitle(model);

    app.navigate(format('schema/%s', model.getId()), {
      silent: true
    });
  },
  template: require('./index.jade'),
  subviews: {
    sidebar: {
      hook: 'sidebar',
      prepareView: function(el) {
        return new SidebarView({
          el: el,
          parent: this,
          collection: app.instance.collections
        }).on('show', this.showCollection.bind(this));
      }
    }
  }
});

module.exports = HomeView;
