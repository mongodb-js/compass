var View = require('ampersand-view');
var format = require('util').format;
var debug = require('debug')('mongodb-compass:help');
var relatedTemplate = require('./related.jade');
var tagTemplate = require('./tags.jade');
var HelpSectionCollection = require('../models/help-section-collection');
var HelpEntryCollection = require('../models/help-entry-collection');
var HelpEntry = require('../models/help-entry');
var SidebarView = require('../sidebar');
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
  collections: {
    sections: HelpSectionCollection
  },
  derived: {
    title: {
      deps: ['entry.title'],
      fn: function() {
        var t = 'MongoDB Compass - Help';
        if (this.entry.title) {
          t += ' - ' + this.entry.title;
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
  template: require('./index.jade'),
  initialize: function(spec) {
    debug('initialize');

    spec = spec || {};
    entries.fetch();

    if (spec.entryId) {
      this.entryId = spec.entryId;
      debug('initialized with entryId `%s`', this.entryId);
    }
    this.listenTo(this, 'change:rendered', function() {
      this.viewSwitcher = new ViewSwitcher(this.queryByHook('help-entry-content'));
      this.show(this.entryId);
    });

    this.listenTo(app, 'show-help-entry', this.show.bind(this));
  },
  onLinkClicked: function(evt) {
    var entryId = evt.delegateTarget.hash.slice(1);
    if (entryId && entries.get(entryId)) {
      evt.preventDefault();
      evt.stopPropagation();
      this.show(entryId);
    }
  },
  onSynced: function(entryId) {
    // group by sections
    this.sections.reset(
      _.map(entries.groupBy('section'), function(value, key) {
        return {
          name: key === 'undefined' ? 'General' : key,
          entries: value
        };
      }), {
        parse: true
      }
    );
    this.show(entryId);
  },
  show: function(entryId) {
    debug('show `%s`', entryId);
    if (entries.length === 0) {
      entries.once('sync', this.onSynced.bind(this, entryId));
      debug('entries not synced yet.  queuing...');
      return;
    }

    if (!entryId) {
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
    var relatedEntries = _(entry.related)
      .map(function(relEntry) {
        return entries.get(relEntry);
      })
      .filter(function(relEntry) {
        return relEntry;
      })
      .value();

    var view = new View({
      /**
       * constructing the final help window template here, which consists of
       * 	 - surrounding <div></div>
       *   - "tags" template, @see ./tags.jade
       *   - the content, @see ./entries/*.md files
       *   - "related" template, @see ./related.jade
       */
      template: '<div>'
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
      // waitFor: 'sections',
      prepareView: function(el) {
        return new SidebarView({
          el: el,
          parent: this,
          collection: this.sections,
          displayProp: 'name',
          filterEnabled: true,
          icon: 'fa-book',
          nested: {
            displayProp: 'title',
            collectionName: 'entries'
          }
        }).on('show', this.show.bind(this));
      }
    }
  }
});

module.exports = HelpPage;
