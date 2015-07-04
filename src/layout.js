var ViewSwitcher = require('ampersand-view-switcher');
var View = require('ampersand-view');
var localLinks = require('local-links');

/**
 * The primary layout view for the app which listens for clicks on
 * any links and updating the `#application` DOM element.
 *
 * @see http://learn.humanjavascript.com/react-ampersand/internal-navigation
 */
module.exports = View.extend({
  session: {
    app: 'state'
  },
  namespace: 'Layout',
  template: require('./layout.jade'),
  initialize: function() {
    this.listenTo(this.app.router, 'page', this.onPageChange);
  },
  events: {
    'click a': 'onLinkClick'
  },
  render: function() {
    this.renderWithTemplate({});
    this.pageSwitcher = new ViewSwitcher(this.queryByHook('page-container'), {
      show: function() {
        document.scrollTop = 0;
      }
    });
  },
  onPageChange: function(view) {
    this.pageSwitcher.set(view);
  },
  onLinkClick: function(event) {
    var pathname = localLinks.getLocalPathname(event);
    if (pathname) {
      event.preventDefault();
      this.app.router.history.navigate(pathname);
    }
  }
});
