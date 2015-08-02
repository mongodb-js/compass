/**
 * Making context menus work (aka right-click menu) involes 2 exchanges
 * between the web-page and the main processes:
 *
 * 1. `web-page` adds a listener for a document `contextmenu` event and sends
 *   a `show-context-menu` message with `template`.
 * 2. `main` catches `show-context-menu`, adds proper click handlers for `template`
 *   and calls `electron#Menu.buildFromTemplate(template).popup()` to make the
 *   context menu actually appear.
 * 3. When a menu item is actually clicked, `main` sends a `run-command` message
 *   to the owning `web-page`.
 * 4. `web-page` calls `electron#ipc.send(item.command, item.opts)`
 * 5. If `main` is listening for `item.command`, it will be executed.
 *
 * @see https://github.com/atom/atom/blob/master/src/context-menu-manager.coffee
 */
var app = require('ampersand-app');
var $ = require('jquery');
var debug = require('debug')('scout:context-menu-manager');

function ContextMenuManager() {
  $(document).on('contextmenu', this.showForEvent.bind(this));
}

ContextMenuManager.prototype.showForEvent = function(event) {
  debug('show for event');
  event.preventDefault();
  var menuTemplate = this.getTemplateForEvent(event);
  if (menuTemplate.length > 0) {
    debug('sending show-context-menu for template', menuTemplate);
    app.ipc.send('show-context-menu', {
      template: menuTemplate
    });
  }
};

ContextMenuManager.prototype.getTemplateForEvent = function(event) {
  var template = [];
  template.push({
    label: 'Inspect Element',
    command: 'devtools-inspect-element',
    opts: {
      x: event.pageX,
      y: event.pageY
    }
  });
  return template;
};

module.exports = new ContextMenuManager();
