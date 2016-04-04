var path = require('path');
var Collection = require('ampersand-rest-collection');
var HelpEntry = require('./help-entry');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var selectableMixin = require('./selectable-collection-mixin');
var filterableMixin = require('ampersand-collection-filterable');
var withSync = require('./with-sync');
var _ = require('lodash');
var mm = require('marky-mark');
var highlight = require('highlight.js');
var debug = require('debug')('mongodb-compass:models:help-entry-collection');

var HelpEntryCollection = Collection.extend(
  selectableMixin, lodashMixin, filterableMixin, {
    namespace: 'HelpEntryCollection',
    comparator: 'title',
    model: HelpEntry
  }, withSync(function(options, done) {
    if (options.method !== 'read') {
      return done(new TypeError('Read-only!'));
    }

    debug('sync called w options', options);

    if (this.models.length > 0) {
      debug('already fetched');
      options.reset = false;
      return done();
    }

    var dir = path.join(__dirname, '..', 'help', 'entries');
    debug('parsing entries with marky-mark from `%s`', dir);

    // add syntax highlighting options, pass through to `marked` module
    var parsingOptions = {
      marked: {
        highlight: function(code) {
          var result = highlight.highlightAuto(code).value;
          return result;
        }
      }
    };

    mm.parseDirectory(dir, parsingOptions, function(err, entries) {
      if (err) {
        return done(err);
      }

      // In production, don't return the dev-only entries
      if (process.env.NODE_ENV === 'production') {
        entries = _.filter(entries, function(entry) {
          return !entry.meta.devOnly;
        });
      }
      done(null, entries);
    });
  }
));

module.exports = HelpEntryCollection;
