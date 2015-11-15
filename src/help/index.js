var View = require('ampersand-view');
var format = require('util').format;
var debug = require('debug')('scout:help');
var HelpEntryCollection = require('../models/help-entry-collection');
var HelpEntry = require('../models/help-entry');
var SidebarView = require('./sidebar');
var ViewSwitcher = require('ampersand-view-switcher');
var app = require('ampersand-app');

var ENTRIES = new HelpEntryCollection();

var HelpPage = View.extend({
  session: {
    entryId: 'string'
  },
  children: {
    entry: HelpEntry
  },
  derived: {
    title: {
      deps: ['entry.title'],
      fn: function() {
        var t = 'MongoDB Compass: Help';
        if (this.entry.title) {
          t += ': ' + this.entry.title;
        }
        return t;
      }
    }
  },
  events: {
    'click a': 'onLinkClicked'
  },
  bindings: {
    'entry.title': {
      hook: 'help-entry-title'
    },
    title: {
      type: function(el, newVal) {
        document.title = newVal;
      }
    }
  },
  onLinkClicked: function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    // @todo handle external links
    var entryId = evt.delegateTarget.hash.slice(1);
    if (entryId) {
      this.show(entryId);
    }
  },
  template: require('./index.jade'),
  initialize: function(spec) {
    spec = spec || {};
    ENTRIES.fetch();

    if (spec.entryId) {
      this.entryId = spec.entryId;
      debug('initialized with entryId `%s`', this.entryId);
    }
    this.listenTo(this, 'change:rendered', function() {
      this.viewSwitcher = new ViewSwitcher(this.queryByHook('help-entry-content'));

      if (this.entryId) {
        this.show(this.entryId);
      }
    });
  },
  show: function(entryId) {
    debug('show `%s`', entryId);
    if (ENTRIES.length === 0) {
      ENTRIES.once('sync', this.show.bind(this, entryId));
      debug('entries not synced yet.  queuing...');
      return;
    }


    var entry = ENTRIES.get(entryId);

    if (!entry) {
      debug('Unknown help entry', entryId);
      this.viewSwitcher.clear();
      app.statusbar.showMessage('Help entry not found.');
      return;
    }

    app.statusbar.hide();

    if (!ENTRIES.select(entry)) {
      debug('already selected');
      return;
    }

    var view = new View({
      template: '<div>' + entry.content + '</div>'
    });
    this.viewSwitcher.set(view);

    this.entry.set(entry.serialize());
    app.navigate(format('help/%s', this.entry.getId()), {
      silent: true
    });
  },
  subviews: {
    sidebar: {
      hook: 'sidebar-subview',
      prepareView: function(el) {
        return new SidebarView({
          el: el,
          parent: this,
          entries: ENTRIES
        });
      }
    }
  }
});

/**
 * Convenience to open the help window if needed and show an item.
 *
 * @param {String} [entryId] - Optional filename to show from `./items/#{entryId}.jade`.
 *
 * @todo (imlucas) Add helper to `./src/electron/window-manager.js` so this works
 * like connect window (singleton w/ custom dimensions).
 */
HelpPage.open = function(entryId) {
  var url = format('%s?#help', window.location.origin);
  if (entryId) {
    url += '/' + entryId;
  }
  debug('Opening item `%s`', entryId);
  window.open(url);
};

module.exports = HelpPage;
