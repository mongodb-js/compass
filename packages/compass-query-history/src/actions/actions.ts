import Reflux from 'reflux';

const configureActions = () => {
  const actions = Reflux.createActions([
    /**
     * define your actions as strings below, for example:
     */
    'showFavorites',
    'showRecent',
    'copyQuery',
    'deleteRecent',
    'deleteFavorite',
    'addRecent',
    'saveFavorite',
    'cancelSave',
    'runQuery',
    'namespaceChanged',
  ]);

  return actions;
};

export default configureActions;
