const React = require('react');
const { StoreConnector } = require('hadron-react-components');
const CRUD = require('./crud');
const Store = require('../stores/crud-store');
const Actions = require('../actions');

class ConnectedCRUD extends React.Component {

  /**
   * Connected CRUD Component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <CRUD actions={Actions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedCRUD.displayName = 'ConnectedCRUD';

module.exports = ConnectedCRUD;
