const React = require('react');
const app = require('ampersand-app');
const StoreConnector = app.appRegistry.getComponent('App.StoreConnector');

const Validation = require('./validation');
const Store = require('../stores');

// const debug = require('debug')('mongodb-compass:validation:index');

class ConnectedValidation extends React.Component {
  /**
   * Connect <Validation /> component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    console.log('#######################################');
    console.log('RENDERING VALIDATION');
    return (
      <StoreConnector store={Store}>
        <Validation />
      </StoreConnector>
    );
  }
}

ConnectedValidation.displayName = 'ConnectedValidation';

module.exports = ConnectedValidation;
