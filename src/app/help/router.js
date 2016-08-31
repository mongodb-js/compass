var AmpersandRouter = require('ampersand-router');
var HelpPage = require('./help-page');
module.exports = AmpersandRouter.extend({
  routes: {
    '': 'index',
    help: 'index',
    'help/:entryId': 'index',
    '(*path)': 'catchAll'
  },
  index: function(entryId) {
    this.help(entryId);
  },
  help: function(entryId) {
    this.trigger('page', new HelpPage({ entryId: entryId }));
  },
  catchAll: function() {
    this.redirectTo('');
  }
});
