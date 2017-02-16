const React = require('react');

const app = require('hadron-app');
const CollectionsStore = require('../stores/collections-store');
const CollectionsTable = require('./collections-table');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedCollectionsTable extends React.Component {

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
      <this.StoreConnector store={CollectionsStore}>
        <CollectionsTable />
      </this.StoreConnector>
    );
  }
}

ConnectedCollectionsTable.displayName = 'ConnectedCollectionsTable';

module.exports = ConnectedCollectionsTable;
