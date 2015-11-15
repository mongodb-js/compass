var View = require('ampersand-view');
var format = require('util').format;
var debug = require('debug')('scout:help');
var relatedTemplate = require('./related.jade');
var tagTemplate = require('./tags.jade');
var HelpEntryCollection = require('../models/help-entry-collection');
var HelpEntry = require('../models/help-entry');
var SidebarView = require('./sidebar');
var ViewSwitcher = require('ampersand-view-switcher');
var app = require('ampersand-app');
var _ = require('lodash');

var entries = new HelpEntryCollection();

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
    entries.fetch();

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
    if (entries.length === 0) {
      entries.once('sync', this.show.bind(this, entryId));
      debug('entries not synced yet.  queuing...');
      return;
    }


    var entry = entries.get(entryId);

    if (!entry) {
      debug('Unknown help entry', entryId);
      this.viewSwitcher.clear();
      app.statusbar.showMessage('Help entry not found.');
      return;
    }

    app.statusbar.hide();

    if (!entries.select(entry)) {
      debug('already selected');
      return;
    }

    // get related entries
    var relatedEntries = _.map(entry.related, function(relEntry) {
      return entries.get(relEntry);
    });

    var view = new View({
      /**
       * constructing the final help window template here, which consists of
       * 	 - surrounding <div></div>
       *   - "tags" template, @see ./tags.jade
       *   - the content, @see ./entries/*.md files
       *   - "related" template, @see ./related.jade
       */
      template:
        '<div>'
        + tagTemplate({
          tags: entry.tags,
          devOnly: entry.devOnly
        })
        + entry.content
        + relatedTemplate({
          relatedEntries: relatedEntries
        })
        + '</div>'
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
          entries: entries
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
