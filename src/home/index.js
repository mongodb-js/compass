var View = require('ampersand-view');
var format = require('util').format;
var SidebarView = require('../sidebar');
var CollectionView = require('./collection');
var TourView = require('../tour');
var app = require('ampersand-app');
var debug = require('debug')('scout:home');

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
    showDefaultZeroState: {
      type: 'boolean',
      default: false
    },
    showNoCollectionsZeroState: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    showDefaultZeroState: {
      hook: 'report-zero-state',
      type: 'booleanClass',
      no: 'hidden'
    },
    showNoCollectionsZeroState: {
      hook: 'no-collections-zero-state',
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  events: {
    'click a.show-connect-window': 'onClickShowConnectWindow'
  },
  initialize: function() {
    this.listenTo(app.instance, 'sync', this.onInstanceFetched);
    this.listenTo(app.connection, 'change:name', this.updateTitle);
    this.listenTo(app, 'show-compass-overview', this.renderTour);

    this.once('change:rendered', this.onRendered);
    debug('fetching instance model...');
    app.instance.fetch();

    app.sendMessage('show compass overview submenu');
    app.sendMessage('show connect submenu');
  },
  render: function() {
    this.renderWithTemplate(this);
    if (localStorage.lastKnownVersion !== app.meta['App Version']) {
      this.renderTour();
      localStorage.lastKnownVersion = app.meta['App Version'];
    }
  },
  renderTour: function() {
    this.renderSubview(new TourView(), this.queryByHook('tour-container'));
  },
  onInstanceFetched: function() {
    if (!this.ns) {
      app.instance.collections.unselectAll();

      if (app.instance.collections.length === 0) {
        this.showNoCollectionsZeroState = true;
      } else {
        this.showDefaultZeroState = true;
      }
    } else {
      this.showCollection(app.instance.collections.get(this.ns));
    }
  },
  updateTitle: function(model) {
    var title = 'mongodb://' + app.connection.instance_id;
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
    this.showDefaultZeroState = false;
    app.navigate(format('schema/%s', model.getId()), {
      silent: true
    });
  },
  onClickShowConnectWindow: function() {
    // code to close current connection window and open connect dialog
    app.sendMessage('show connect dialog');
    window.close();
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
