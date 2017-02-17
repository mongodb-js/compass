const React = require('react');
const app = require('hadron-app');

const Validation = require('./validation');
const Store = require('../stores');

// const debug = require('debug')('mongodb-compass:validation:index');

class ConnectedValidation extends React.Component {

  constructor(props) {
    super(props);
    this.StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
  }

  /**
   * Connect <Validation /> component to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <this.StoreConnector store={Store}>
        <Validation />
      </this.StoreConnector>
    );
  }
}

ConnectedValidation.displayName = 'ConnectedValidation';

module.exports = ConnectedValidation;
