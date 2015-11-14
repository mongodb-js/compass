var View = require('ampersand-view');
var jade = require('jade');
var HelpEntryCollection = require('../models/help-entry-collection');

var SidebarItemView = View.extend({
  namespace: 'HelpSidebarItemView',
  bindings: {
    'model.url': {
      hook: 'url'
    },
    'model.title': {
      hook: 'title'
    },
    'model.description': {
      hook: 'description'
    },
    'model.selected': {
      type: 'booleanClass',
      yes: 'active'
    }
  },
  template: jade.compile([
    'a.list-group-item(data-hook="url")',
    '  h4.list-group-item-heading(data-hook="title")'
  ].join('\n'))
});

var SidebarView = View.extend({
  collections: {
    entries: HelpEntryCollection
  },
  namespace: 'HelpSidebarView',
  template: require('./sidebar.jade'),
  render: function() {
    this.renderWithTemplate({});
    this.renderCollection(this.entries, SidebarItemView, this.queryByHook('help-entry-list'));
  }
});

module.exports = SidebarView;
