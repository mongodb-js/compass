const Reflux = require('reflux');

const Actions = Reflux.createActions([
  /**
   * define your actions as strings below, for example:
   */
  'showFavorites',
  'showRecent',
  'collapse',
  'addRecent',
  'addFavorite',
  'saveFavorite'
]);

module.exports = Actions;
