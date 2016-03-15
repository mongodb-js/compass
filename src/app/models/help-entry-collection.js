var Collection = require('ampersand-rest-collection');
var HelpEntry = require('./help-entry');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var selectableMixin = require('./selectable-collection-mixin');
var filterableMixin = require('ampersand-collection-filterable');
var withSync = require('./with-sync');
var debug = require('debug')('mongodb-compass:models:help-entry-collection');
var electron = require('electron');
var ipc = electron.ipcRenderer;

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

    var onSuccess;
    var onError = function(evt, err) {
      debug('error', err);
      ipc.removeListener('/help/entries/success', onSuccess);
      done(err);
    };

    onSuccess = function(evt, entries) {
      debug('got entries', entries);
      ipc.removeListener('/help/entries/error', onError);
      done(null, entries);
    };

    debug('loading help entries...');
    ipc.once('/help/entries/success', onSuccess);
    ipc.once('/help/entries/error', onError);
    ipc.send('/help/entries');
  }
));

module.exports = HelpEntryCollection;
