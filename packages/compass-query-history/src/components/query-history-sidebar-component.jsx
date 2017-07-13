const React = require('react');
const QueryHistoryHeaderComponent = require('./query-history-header-component');
const QueryHistoryRecentListComponent = require('./query-history-recent-list-component');
const QueryHistoryFavoritesListComponent = require('./query-history-favorites-list-component');
const QueryHistoryHeaderStore = require('../stores/query-history-header-store');
const QueryHistoryRecentListStore = require('../stores/query-history-recent-list-store');
const QueryHistoryFavoritesListStore = require('../stores/query-history-favorites-list-store');
const { StoreConnector } = require('hadron-react-components');
const PropTypes = require('prop-types');

// const debug = require('debug')('mongodb-compass:query-history-sidebar-component');

class QueryHistorySidebarComponent extends React.Component {

  /**
   * Render QueryHistorySidebar component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const ListComponent = this.props.showing === 'recent' ? QueryHistoryRecentListComponent : QueryHistoryFavoritesListComponent;
    const ListStore = this.props.showing === 'recent' ? QueryHistoryRecentListStore : QueryHistoryFavoritesListStore;
    return (
      <div className="query-history-sidebar-component">
        <p>Sidebar.props.showing={this.props.showing}</p>
        <StoreConnector store={QueryHistoryHeaderStore}>
          <QueryHistoryHeaderComponent showing={this.props.showing}/>
        </StoreConnector>
        <StoreConnector store={ListStore}>
          <ListComponent/>
        </StoreConnector>
      </div>
    );
  }
}

QueryHistorySidebarComponent.propTypes = {
  showing: PropTypes.oneOf(['recent', 'favorites'])
};

QueryHistorySidebarComponent.defaultProps = {
  showing: 'recent'
};


QueryHistorySidebarComponent.displayName = 'QueryHistorySidebarComponent';

module.exports = QueryHistorySidebarComponent;
