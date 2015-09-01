var View = require('ampersand-view');
var format = require('util').format;
var SidebarView = require('../sidebar');
var debug = require('debug')('scout-ui:home');
var CollectionView = require('./collection');
var app = require('ampersand-app');

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
    },
    showZeroState: {
      type: 'boolean',
      default: true
    }
  },
  bindings: {
    showZeroState: {
      hook: 'report-zero-state',
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  initialize: function() {
    this.listenTo(app.instance, 'sync', this.onInstanceFetched);
    this.listenTo(app.connection, 'change:name', this.updateTitle);
    this.once('change:rendered', this.onRendered);
    app.instance.fetch();
  },
  onInstanceFetched: function() {
    if (!this.ns) {
      app.instance.collections.unselectAll();
    } else {
      this.showCollection(app.instance.collections.get(this.ns));
    }
  },
  updateTitle: function(model) {
    var title = app.connection.uri;
    if (model) {
      title += '/' + model.getId();
    }
    title += ' (' + app.connection.name + ')';
    document.title = title;
  },
  showCollection: function(model) {
    var collection = app.instance.collections;
    if (!collection.select(model)) {
      return debug('already selected %s', model);
    }

    this.ns = model.getId();
    this.updateTitle(model);
    this.showZeroState = false;
    app.navigate(format('schema/%s', model.getId()), {
      silent: true
    });
  },
  template: require('./index.jade'),
  subviews: {
    _collection: {
      hook: 'collection-subview',
      prepareView: function(el) {
        return new CollectionView({
          el: el,
          parent: this
        });
      }
    },
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
