const Reflux = require('reflux');

const QueryHistoryActions = Reflux.createActions([
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

module.exports = QueryHistoryActions;
