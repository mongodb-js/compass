const Reflux = require('reflux');

const SidebarActions = Reflux.createActions([
  /**
   * define your actions as strings below, for example:
   */
  'filterDatabases',

  /**
   * Show or hide the sidebar (good for demos).
   */
  'toggleVisibility'
]);

module.exports = SidebarActions;
