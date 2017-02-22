const React = require('react');

const app = require('hadron-app');
const ChartBuilder = require('./chart-builder');
const Store = require('../store');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:chart:index');

class ConnectedChartBuilder extends React.Component {

  constructor(props) {
    super(props);
    this.StoreConnector = app.appRegistry.getComponent('App.StoreConnector');
  }

  /**
   * Connect ChartBuilder to store and actions.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <this.StoreConnector store={Store}>
        <ChartBuilder actions={Actions} />
      </this.StoreConnector>
    );
  }
}

ConnectedChartBuilder.displayName = 'ConnectedChartBuilder';

module.exports = ConnectedChartBuilder;
