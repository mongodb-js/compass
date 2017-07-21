const Reflux = require('reflux');

const Actions = Reflux.createActions([
  /**
   * define your actions as strings below, for example:
   */
  'showFavorites',
  'showRecent',
  'collapse', // TODO: handle collapsing sidebar
  'copyQuery',
  'deleteRecent',
  'deleteFavorite',
  'addRecent',
  'saveRecent',
  'saveFavorite',
  'cancelSave'
]);

module.exports = Actions;
