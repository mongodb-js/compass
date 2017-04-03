const React = require('react');

const { StoreConnector } = require('hadron-react-components');
const ChartBuilder = require('./chart-builder');
const Store = require('../store');
const Actions = require('../actions');

// const debug = require('debug')('mongodb-compass:chart:index');

class ConnectedChartBuilder extends React.Component {

  /**
   * Connect ChartBuilder to store and actions.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={Store}>
        <ChartBuilder actions={Actions} />
      </StoreConnector>
    );
  }
}

ConnectedChartBuilder.displayName = 'ConnectedChartBuilder';

module.exports = ConnectedChartBuilder;
