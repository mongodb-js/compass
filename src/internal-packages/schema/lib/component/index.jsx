const React = require('react');

const { StoreConnector } = require('hadron-react-components');
const Schema = require('./schema');
const SchemaActions = require('../action');
const SchemaStore = require('../store');

// const debug = require('debug')('mongodb-compass:schema:index');

class ConnectedSchema extends React.Component {

  /**
   * Connect Schema component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={SchemaStore}>
        <Schema actions={SchemaActions} {...this.props} />
      </StoreConnector>
    );
  }
}

ConnectedSchema.displayName = 'ConnectedSchema';

module.exports = ConnectedSchema;
