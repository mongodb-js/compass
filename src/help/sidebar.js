var View = require('ampersand-view');
var jade = require('jade');
var debug = require('debug')('mongodb-compass:help:sidebar');

var SidebarItemView = View.extend({
  namespace: 'HelpSidebarItemView',
  bindings: {
    'model.url': {
      hook: 'url',
      type: 'attribute',
      name: 'href'
    },
    'model.title': {
      hook: 'title'
    },
    'model.description': {
      hook: 'description'
    },
    'model.selected': {
      type: 'booleanClass',
      yes: 'selected'
    }
  },
  events: {
    'click a': 'show'
  },
  show: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.parent.parent.show(this.model.getId());
  },
  template: jade.compile([
    'a.list-group-item(data-hook="url")',
    '  span(data-hook="title")'
  ].join('\n'))
});

var SidebarView = View.extend({
  initialize: function(spec) {
    this.entries = spec.entries;
  },
  namespace: 'HelpSidebarView',
  template: require('./sidebar.jade'),
  render: function() {
    this.renderWithTemplate(this);
    debug('rendering collection', this.entries);
    this.renderCollection(this.entries, SidebarItemView, this.queryByHook('help-entry-list'));
  }
});

module.exports = SidebarView;
