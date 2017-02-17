const React = require('react');

const app = require('hadron-app');
const CompassExplain = require('./compass-explain');
const Store = require('../stores');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedCompassExplain extends React.Component {

  constructor(props) {
    super(props);
    this.StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
  }

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <this.StoreConnector store={Store}>
        <CompassExplain />
      </this.StoreConnector>
    );
  }
}

ConnectedCompassExplain.displayName = 'ConnectedCompassExplain';

module.exports = ConnectedCompassExplain;
