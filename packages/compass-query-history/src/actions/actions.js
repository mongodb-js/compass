import Reflux from 'reflux';

const configureActions = () => {
  const actions = Reflux.createActions([
    /**
     * define your actions as strings below, for example:
     */
    'showFavorites',
    'showRecent',
    'collapse',
    'toggleCollapse',
    'copyQuery',
    'deleteRecent',
    'deleteFavorite',
    'addRecent',
    'saveRecent',
    'saveFavorite',
    'cancelSave',
    'runQuery',
    'namespaceChanged'
  ]);

  return actions;
};

export default configureActions;
