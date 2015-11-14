var Collection = require('ampersand-rest-collection');
var HelpEntry = require('./help-entry');
var selectableMixin = require('./selectable-collection-mixin');
var withSync = require('./with-sync');
var debug = require('debug')('scout:models:help-entry-collection');
var ipc = window.require('ipc');

var HelpEntryCollection = Collection.extend(selectableMixin, {
  namespace: 'HelpEntryCollection',
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
  var onError = function(err) {
    debug('error', err);
    ipc.removeListener('/help/entries/success', onSuccess);
    done(err);
  };

  onSuccess = function(entries) {
    debug('got entries', entries);
    ipc.removeListener('/help/entries/error', onError);
    done(null, entries);
  };

  debug('loading help entries...');
  ipc.once('/help/entries/success', onSuccess)
    .once('/help/entries/error', onError)
    .send('/help/entries');
}));

module.exports = HelpEntryCollection;
