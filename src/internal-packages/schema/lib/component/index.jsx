const React = require('react');

const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
const Schema = require('./schema');
const Store = require('../store');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedSchema extends React.Component {
  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <Schema />
      </StoreConnector>
    );
  }
}

ConnectedSchema.displayName = 'ConnectedSchema';

module.exports = ConnectedSchema;
