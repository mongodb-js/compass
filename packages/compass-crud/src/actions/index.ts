import Reflux from 'reflux';

/**
 * Reflux actions consumed by the legacy grid-store. The crud store itself is
 * Redux-based; these actions only exist to drive the still-Reflux grid store
 * from components.
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
