var State = require('ampersand-state');
var format = require('util').format;
var debug = require('debug')('scout:models:help-entry');

var HelpEntry = State.extend({
  namespace: 'HelpEntry',
  props: {
    id: 'string',
    title: 'string',
    content: 'string',
    tags: 'array',
    related: 'array',
    devOnly: 'boolean',
    section: 'string'
  },
  derived: {
    url: {
      deps: ['id'],
      fn: function() {
        return format('/help/%s', this.getId());
      }
    }
  },
  session: {
    selected: {
      type: 'boolean',
      default: false
    }
  },
  parse: function(resp) {
    debug('parse', resp);
    return {
      id: resp.filename.replace('.md', ''),
      title: resp.meta.title,
      tags: resp.meta.tags || [],
      content: resp.content,
      related: resp.meta.related || [],
      devOnly: !!resp.meta.devOnly,
      section: resp.meta.section
    };
  }
});

module.exports = HelpEntry;
