const React = require('react');
const QueryHistoryHeaderComponent = require('./query-history-header-component');
const QueryHistoryListComponent = require('./query-history-list-component');
const QueryHistoryHeaderStore = require('../stores/query-history-header-store');
const QueryHistoryListStore = require('../stores/query-history-list-store');
const { StoreConnector } = require('hadron-react-components');

// const debug = require('debug')('mongodb-compass:query-history-sidebar-component');

class QueryHistorySidebarComponent extends React.Component {

  /**
   * Render QueryHistorySidebar component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className="query-history-sidebar-component">
        <StoreConnector store={QueryHistoryHeaderStore}>
          <QueryHistoryHeaderComponent />
        </StoreConnector>
        <StoreConnector store={QueryHistoryListStore}>
          <QueryHistoryListComponent />
        </StoreConnector>
      </div>
    );
  }
}

QueryHistorySidebarComponent.displayName = 'QueryHistorySidebarComponent';

module.exports = QueryHistorySidebarComponent;
