const React = require('react');

const { StoreConnector } = require('hadron-react-components');
const CollectionsStore = require('../stores/collections-store');
const CollectionsTable = require('./collections-table');

// const debug = require('debug')('mongodb-compass:compass-explain:index');

class ConnectedCollectionsTable extends React.Component {

  /**
   * Connect CompassExplainComponent to store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <StoreConnector store={CollectionsStore}>
        <CollectionsTable />
      </StoreConnector>
    );
  }
}

ConnectedCollectionsTable.displayName = 'ConnectedCollectionsTable';

module.exports = ConnectedCollectionsTable;
