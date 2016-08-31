var Collection = require('ampersand-rest-collection');
var HelpEntry = require('./help-entry');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var selectableMixin = require('../models/selectable-collection-mixin');
var filterableMixin = require('ampersand-collection-filterable');
var withSync = require('../models/with-sync');
var debug = require('debug')('mongodb-compass:help:help-entry-collection');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');

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

    var dir = path.join(__dirname, 'entries');
    fs.readdir(dir, function(err, files) {
      if (err) {
        debug('error reading entries', err);
        done(err);
        return;
      }

      var entries = _.map(files, function(file) {
        return require(path.join(dir, file));
      });

      // in production don't return the dev-only entries
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
