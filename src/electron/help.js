var path = require('path');
var ipc = require('ipc');
var mm = require('marky-mark');
var _ = require('lodash');
var debug = require('debug')('scout:electron:help');

debug('adding ipc listener for `/help/entries`...');
ipc.on('/help/entries', function(evt) {
  var dir = path.join(__dirname, '..', 'help', 'entries');
  debug('parsing entries with marky-mark from `%s`', dir);
  mm.parseDirectory(dir, function(err, posts) {
    if (err) {
      debug('error parsing entries', err);
      evt.sender.send('/help/entries/error', err);
      return;
    }
    debug('successfully parsed!', posts);
    // in production don't return the dev-only entries
    if (process.env.NODE_ENV === 'production') {
      posts = _.filter(posts, function(post) {
        return !post.meta.devOnly;
      });
    }
    evt.sender.send('/help/entries/success', posts);
  });
});
