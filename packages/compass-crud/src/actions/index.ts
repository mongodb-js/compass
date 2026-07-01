import Reflux from 'reflux';

/**
 * Reflux actions used by the grid-store. The crud store is
 * Redux-based, these actions are only for the still-Reflux grid store.
 */
const configureActions = () => {
  const actions = Reflux.createActions([
    'addColumn',
    'cleanCols',
    'elementAdded',
    'elementMarkRemoved',
    'elementRemoved',
    'elementTypeChanged',
    'removeColumn',
    'renameColumn',
    'replaceDoc',
    'resetColumns',
  ]);

  return actions;
};

export default configureActions;
