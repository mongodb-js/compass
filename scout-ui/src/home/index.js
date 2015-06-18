var AmpersandView = require('ampersand-view');
var ViewSwitcher = require('ampersand-view-switcher');
var models = require('../models');
var debug = require('debug')('scout-ui:home');
var app = require('ampersand-app');
var format = require('util').format;
var SidebarView = require('../sidebar');
var CollectionView = require('./collection');

require('bootstrap/js/dropdown');
require('bootstrap/js/collapse');

module.exports = AmpersandView.extend({
  children: {
    model: models.Instance
  },
  props: {
    ns: {
      type: 'string',
      allowNull: true,
      default: null
    }
  },
  initialize: function(options) {
    options = options || {};
    this.ns = options.ns;

    app.statusbar.watch(this, this.model);

    this.listenTo(this.model, 'sync', function() {
      if (!this.ns) return;

      var current = this.model.collections.find({
        _id: this.ns
      });
      if (!current) return;

      this.showCollection(current);
    });

    this.listenTo(this, 'change:rendered', this.onRendered);
    this.model.fetch();
  },
  onRendered: function() {
    this.switcher = new ViewSwitcher(this.queryByHook('collection-container'), {
      show: function() {}
    });
  },
  showCollection: function(model) {
    if (!this.model.collections.select(model)) {
      return debug('already selected %s', model);
    }

    this.switcher.set(new CollectionView({
      model: model
    }));

    app.url(format('schema/%s', model.getId()));
    document.title = format('mongodb://%s/%s', this.model.getId(), model.getId());
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
