var View = require('ampersand-view');
var format = require('util').format;
var debug = require('debug')('scout:help');
var HelpEntryCollection = require('../models/help-entry-collection');
var SidebarView = require('./sidebar');

var HelpPage = View.extend({
  session: {
    itemId: 'string'
  },
  collections: {
    entries: HelpEntryCollection
  },
  template: require('./index.jade'),
  initialize: function(spec) {
    spec = spec || {};
    this.entries.fetch();

    if (spec.itemId) {
      this.itemId = spec.itemId;
      debug('initialized with itemId `%s`', this.itemId);
    }
  },
  render: function() {
    this.renderWithTemplate(this);
    /**
     * @todo (imlucas) switch to `ampersand-view-switcher`.
     */
    if (this.itemId) {
      if (this.entries.length === 0) {
        this.listenTo(this.entries, 'sync', this.render.bind(this));
        return;
      }
      debug('rendering item `%s`', this.itemId);
      var item = this.entries.get(this.itemId);

      var subview = new View();
      subview.template = item.content;
      this.renderSubview(subview, this.queryByHook('item-subview'));
    }
  },
  subviews: {
    sidebar: {
      hook: 'sidebar-subview',
      prepareView: function(el) {
        return new SidebarView({
          el: el,
          parent: this,
          entries: this.entries
        });
      }
    }
  }
});

/**
 * Convenience to open the help window if needed and show an item.
 *
 * @param {String} [itemId] - Optional filename to show from `./items/#{itemId}.jade`.
 *
 * @todo (imlucas) Add helper to `./src/electron/window-manager.js` so this works
 * like connect window (singleton w/ custom dimensions).
 */
HelpPage.open = function(itemId) {
  var url = format('%s?#help', window.location.origin);
  if (itemId) {
    url += '/' + itemId;
  }
  debug('Opening item `%s`', itemId);
  window.open(url);
};

module.exports = HelpPage;
